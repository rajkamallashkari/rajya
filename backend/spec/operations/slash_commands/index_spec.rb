require "rails_helper"

RSpec.describe SlashCommands::Index do
  it "lists builtins plus commands declared by bots present in the conversation" do
    user = create(:user)
    present = create(:bot)
    absent = create(:bot)
    create(:bot_command, bot: present, name: "plan", description: "Turn a goal into steps",
           usage_hint: "/plan <goal>", position: 0)
    create(:bot_command, bot: absent, name: "test", description: "Suggest a test")
    conversation = create_direct_between(user.account, present.account)

    names = described_class.call(conversation: conversation).value.commands.map(&:name)

    expect(names).to eq(%w[sticker gif help plan])
    expect(names).not_to include("test")
  end

  it "omits commands from left memberships and deactivated bots" do
    owner = create(:user)
    left = create(:bot)
    dead = create(:bot)
    create(:bot_command, bot: left, name: "plan", description: "Plan")
    create(:bot_command, bot: dead, name: "test", description: "Test")
    group = create_talk(kind: "group", owner: owner.account, members: [ left.account, dead.account ])
    ConversationMembership.active.find_by!(conversation: group, account: left.account)
                          .update!(status: "left")
    dead.deactivate!

    names = described_class.call(conversation: group).value.commands.map(&:name)

    expect(names).to eq(%w[sticker gif help])
  end

  it "fails when the conversation is missing" do
    expect(described_class.call(conversation: nil).error_code).to eq(:not_found)
  end
end
