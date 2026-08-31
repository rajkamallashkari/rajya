require "rails_helper"

RSpec.describe Bots::Dispatch do
  it "enqueues a reply for a direct bot chat" do
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value

    expect(Bots::ReplyJob).to have_been_enqueued.with(conversation.id, message.id, bot.id)
  end

  it "enqueues a mentioned group bot and ignores an untagged one (BR-83)" do
    owner = create(:user)
    tagged = create(:bot)
    silent = create(:bot)
    group = create_talk(kind: "group", owner: owner.account, members: [ tagged.account, silent.account ])
    mentioned = Messages::Send.call(
      conversation: group, sender: owner.account, body: "Hey <@#{tagged.account_id}>"
    ).value
    Messages::Send.call(conversation: group, sender: owner.account, body: "no tag")

    expect(Bots::ReplyJob).to have_been_enqueued.with(group.id, mentioned.id, tagged.id).once
    expect(Bots::ReplyJob).not_to have_been_enqueued.with(group.id, anything, silent.id)
  end

  it "enqueues a group bot when its declared slash command is invoked (NR-45)" do
    owner = create(:user)
    planner = create(:bot)
    silent = create(:bot)
    create(:bot_command, bot: planner, name: "plan", description: "Turn a goal into steps")
    group = create_talk(kind: "group", owner: owner.account, members: [ planner.account, silent.account ])
    nonce = SecureRandom.uuid
    message = Messages::Send.call(
      conversation: group, sender: owner.account, body: "/plan ship friday", client_nonce: nonce
    ).value

    expect(message).to have_attributes(body: "/plan ship friday", client_nonce: nonce)
    expect(Bots::ReplyJob).to have_been_enqueued.with(group.id, message.id, planner.id).once
    expect(Bots::ReplyJob).not_to have_been_enqueued.with(group.id, anything, silent.id)
  end

  it "does not dispatch a client-only builtin in a group" do
    owner = create(:user)
    bot = create(:bot)
    group = create_talk(kind: "group", owner: owner.account, members: [ bot.account ])
    message = Messages::Send.call(conversation: group, sender: owner.account, body: "/sticker").value

    expect(message.body).to eq("/sticker")
    expect(Bots::ReplyJob).not_to have_been_enqueued.with(group.id, message.id, bot.id)
  end

  it "does not dispatch from a bot-authored message (BR-83)" do
    user = create(:user)
    bot = create(:bot)
    other = create(:bot)
    group = create_talk(kind: "group", owner: user.account, members: [ bot.account, other.account ])
    prompt = Messages::Send.call(conversation: group, sender: user.account, body: "Hi <@#{bot.account_id}>").value
    reply = Bots::PersistReply.call(
      conversation: group, bot: bot, body: "I ping <@#{other.account_id}>",
      triggered_by: prompt, generation_id: "g", nonce: SecureRandom.uuid
    ).value

    expect { described_class.call(message: reply) }.not_to have_enqueued_job(Bots::ReplyJob)
  end

  # rubocop:disable RSpec/ExampleLength -- factory setup for a sender-less system row
  it "does not dispatch a system message with no sender" do
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    system = create(
      :message,
      conversation: conversation,
      kind: "system",
      system_event: "member_added",
      sender_account: nil,
      sender_snapshot: { "display_name" => "Ada" },
      body: nil,
      position: conversation.messages.maximum(:position).to_i + 1
    )

    result = nil
    expect { result = described_class.call(message: system) }.not_to have_enqueued_job(Bots::ReplyJob)
    expect(result.value).to eq(0)
  end
  # rubocop:enable RSpec/ExampleLength

  it "does not enqueue when async bot replies are flagged off" do
    create(:feature_flag, key: "async_bot_replies",
           description: FeatureFlagRegistry.description_for(:async_bot_replies), enabled: false)
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)

    expect {
      Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi")
    }.not_to have_enqueued_job(Bots::ReplyJob)
  end
end
