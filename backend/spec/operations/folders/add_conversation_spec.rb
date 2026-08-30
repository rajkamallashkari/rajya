require "rails_helper"

RSpec.describe Folders::AddConversation do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    folder = Folders::Create.call(account: user.account, name: "Work").value
    [ user, conversation, folder ]
  end

  it "adds a member conversation and is idempotent" do
    user, conversation, folder = setup
    first = described_class.call(account: user.account, folder: folder, conversation: conversation)
    second = described_class.call(account: user.account, folder: folder, conversation: conversation)

    expect(first).to be_success
    expect(second).to be_success
    expect(folder.conversation_folder_entries.map(&:conversation_id)).to eq([ conversation.id ])
  end

  it "forbids a stranger's folder or a conversation the account cannot see" do
    user, conversation, folder = setup
    stranger = create(:user).account
    expect(described_class.call(account: stranger, folder: folder, conversation: conversation).error_code)
      .to eq(:forbidden)
    hidden = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    expect(described_class.call(account: user.account, folder: folder, conversation: hidden).error_code)
      .to eq(:forbidden)
  end

  it "returns validation_failed when the entry cannot be saved" do
    user, conversation, folder = setup
    allow(folder.conversation_folder_entries).to receive(:count).and_return(-1)
    expect(
      described_class.call(account: user.account, folder: folder, conversation: conversation).error_code
    ).to eq(:validation_failed)
  end
end
