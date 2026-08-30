require "rails_helper"

RSpec.describe AttachmentPolicy do
  it "allows an active member to download and retry (BR-94)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    attachment = create(:attachment, message: create(:message, conversation: conversation, sender_account: user.account))

    expect(described_class.new(user.account, attachment)).to be_show
    expect(described_class.new(user.account, attachment)).to be_retry
    expect(described_class.new(user.account, attachment)).to be_transcribe
  end

  it "denies a stranger download and retry (BR-94)" do
    user = create(:user)
    stranger = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    attachment = create(:attachment, message: create(:message, conversation: conversation, sender_account: user.account))

    expect(described_class.new(stranger.account, attachment)).not_to be_show
    expect(described_class.new(stranger.account, attachment)).not_to be_retry
    expect(described_class.new(stranger.account, attachment)).not_to be_transcribe
    expect(described_class.new(nil, attachment)).not_to be_show
  end

  it "scopes attachments to conversations the account belongs to" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    mine = create(:attachment, message: create(:message, conversation: conversation, sender_account: user.account))
    create(:attachment)

    expect(described_class::Scope.new(user.account, Attachment.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, Attachment.all).resolve).to be_empty
  end
end
