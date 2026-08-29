require "rails_helper"

RSpec.describe Conversations::Update do
  it "updates title and description on a group" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    result = described_class.call(account: owner.account, conversation: conversation, title: "New", description: "Bio")

    expect(result).to be_success
    expect(result.value.conversation.title).to eq("New")
    expect(result.value.conversation.description).to eq("Bio")
  end

  it "rejects a blank title, a direct conversation, and still allows clearing description" do
    owner = create(:user)
    group = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    group.update!(description: "keep")
    direct = create_direct_between(owner.account)

    expect(described_class.call(account: owner.account, conversation: group, title: "   ").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: owner.account, conversation: direct, title: "X").error_code)
      .to eq(:forbidden)
    described_class.call(account: owner.account, conversation: group, description: nil)
    expect(group.reload.description).to be_nil
  end

  it "updates title without touching description when description is omitted" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    conversation.update!(description: "keep")
    described_class.call(account: owner.account, conversation: conversation, title: "Only")

    expect(conversation.reload).to have_attributes(title: "Only", description: "keep")
  end
end
