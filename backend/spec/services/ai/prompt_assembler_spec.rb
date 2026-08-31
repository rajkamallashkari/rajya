require "rails_helper"

RSpec.describe Ai::PromptAssembler do
  def bot_dm
    user = create(:user)
    bot = create(:bot, persona_prompt: "You are Sage.")
    conversation = create_direct_between(user.account, bot.account)
    [ user, bot, conversation ]
  end

  def send_text(conversation, sender, body, **attrs)
    Messages::Send.call(conversation: conversation, sender: sender, body: body, **attrs).value
  end

  it "includes the persona, template, and last context-window turns" do
    user, bot, conversation = bot_dm
    stub_setting(:ai_context_window, 2, category: "ai")
    send_text(conversation, user.account, "one")
    send_text(conversation, user.account, "two")
    trigger = send_text(conversation, user.account, "three")

    assembled = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(assembled.first).to include(role: "system", content: a_string_including("Sage", "helpful assistant"))
    expect(assembled.pluck(:content)).to include("two", "three")
    expect(assembled.pluck(:content)).not_to include("one")
  end

  it "injects the rolling summary and quoted reply-target as distinct system turns (NR-12, BR-75)" do
    user, bot, conversation = bot_dm
    quoted = send_text(conversation, user.account, "earlier point")
    conversation.update!(context_summary: "They discussed maps.")
    trigger = send_text(conversation, user.account, "about that", reply_to_message_id: quoted.id)

    assembled = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
    systems = assembled.select { |turn| turn.fetch(:role) == "system" }.pluck(:content)

    expect(systems).to include(a_string_including("They discussed maps."))
    expect(systems).to include(a_string_including("quoted context", "earlier point"))
  end

  it "skips deleted quotes, blank bodies, and system messages" do
    user, bot, conversation = bot_dm
    quoted = send_text(conversation, user.account, "gone")
    quoted.update!(deleted_at: Time.current, body: nil)
    create(:message, conversation: conversation, kind: "system", system_event: "member_added",
           sender_account: nil, sender_snapshot: { "display_name" => "Ada" }, body: nil,
           position: conversation.messages.maximum(:position) + 1)
    trigger = send_text(conversation, user.account, "still here", reply_to_message_id: quoted.id)

    assembled = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(assembled.pluck(:content).join).not_to include("quoted context")
    expect(assembled.last).to include(role: "user", content: "still here")
  end

  # rubocop:disable RSpec/ExampleLength -- quote skip, assistant role, blank and orphan turns
  it "skips a live quote with a blank body and labels bot turns as assistant" do
    user, bot, conversation = bot_dm
    quoted = send_text(conversation, user.account, "keep")
    quoted.update_columns(body: "")
    send_text(conversation, bot.account, "I heard you")
    trigger = send_text(conversation, user.account, "go on", reply_to_message_id: quoted.id)
    create(:message, conversation: conversation, sender_account: user.account, body: "   ",
           position: conversation.messages.maximum(:position) + 1)
    orphan = send_text(conversation, user.account, "nobody")
    orphan.update_columns(sender_account_id: nil)

    assembled = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(assembled.pluck(:content).join).not_to include("quoted context")
    expect(assembled).to include(role: "assistant", content: "I heard you")
    expect(assembled).to include(role: "user", content: "nobody")
    expect(assembled.pluck(:content)).not_to include("   ")
  end
  # rubocop:enable RSpec/ExampleLength

  it "picks up a shorter context window without a restart" do
    user, bot, conversation = bot_dm
    stub_setting(:ai_context_window, 1, category: "ai")
    send_text(conversation, user.account, "old")
    trigger = send_text(conversation, user.account, "new")

    contents = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                              .pluck(:content)

    expect(contents).to include("new")
    expect(contents).not_to include("old")
  end

  it "injects retrieved shared memories as a system turn (NR-11)" do
    user, bot, conversation = bot_dm
    trigger = send_text(conversation, user.account, "ask")
    memory = instance_double(BotMemory, content: "The project codename is Orchid")
    allow(Bots::RetrieveMemories).to receive(:call).and_return(Result.success([ memory ]))

    systems = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                              .select { |turn| turn.fetch(:role) == "system" }.pluck(:content)

    expect(systems.join).to include("Orchid")
  end

  it "skips a memory turn when retrieved rows have blank content" do
    user, bot, conversation = bot_dm
    trigger = send_text(conversation, user.account, "ask")
    allow(Bots::RetrieveMemories).to receive(:call).and_return(
      Result.success([ instance_double(BotMemory, content: "  ") ])
    )

    systems = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                             .select { |turn| turn.fetch(:role) == "system" }.pluck(:content)
    expect(systems.join).not_to include("remember")
  end

  it "injects slash-command context for a declared command" do
    user, bot, conversation = bot_dm
    create(:bot_command, bot: bot, name: "plan", description: "Turn a goal into steps")
    trigger = send_text(conversation, user.account, "/plan ship friday")

    systems = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                             .select { |turn| turn.fetch(:role) == "system" }.pluck(:content)

    expect(systems.join).to include("slash command", "/plan", "ship friday")
  end

  it "lists available commands when /help is invoked" do
    user, bot, conversation = bot_dm
    create(:bot_command, bot: bot, name: "plan", description: "Turn a goal into steps",
           usage_hint: "/plan <goal>")
    create(:bot_command, bot: bot, name: "status", description: "Bot status")
    trigger = send_text(conversation, user.account, "/help")

    systems = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                             .select { |turn| turn.fetch(:role) == "system" }.pluck(:content)

    expect(systems.join).to include("available", "/plan", "/help", "/plan <goal>")
  end

  it "skips slash context when the prefix is not this bot's command" do
    user, bot, conversation = bot_dm
    trigger = send_text(conversation, user.account, "/unknown")

    systems = described_class.messages(conversation: conversation, bot: bot, triggered_by: trigger)
                             .select { |turn| turn.fetch(:role) == "system" }.pluck(:content)

    expect(systems.join).not_to include("slash command")
  end
end
