require "rails_helper"

RSpec.describe ExportJobs::Create do
  it "enqueues a pending job for the requester" do
    user = create(:user)
    expect do
      result = described_class.call(account: user.account, format: "json")
      expect(result).to be_success
      expect(result.value).to have_attributes(format: "json", status: "pending", conversation_id: nil)
    end.to have_enqueued_job(ExportJobs::GenerateJob)
  end

  it "rejects an unknown format" do
    expect(described_class.call(account: create(:user).account, format: "pdf").error_code).to eq(:validation_failed)
  end

  it "rejects a conversation the account has left or that restricts forwarding (NR-32, NR-37)" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    conversation.update!(restrict_forwarding: true)
    expect(described_class.call(account: user.account, conversation_id: conversation.id).error_code).to eq(:forbidden)

    conversation.update!(restrict_forwarding: false)
    ConversationMembership.active.find_by!(account: user.account, conversation: conversation).update!(status: "left")
    expect(described_class.call(account: user.account, conversation_id: conversation.id).error_code).to eq(:not_found)
    expect(described_class.call(account: user.account, conversation_id: 0).error_code).to eq(:not_found)
  end

  it "scopes a conversation export to an active membership" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    result = described_class.call(account: user.account, conversation_id: conversation.id, format: "txt", include_media: true)

    expect(result.value).to have_attributes(conversation: conversation, format: "txt", include_media: true)
  end
end
