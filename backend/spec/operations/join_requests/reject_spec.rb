require "rails_helper"

RSpec.describe JoinRequests::Reject do
  it "rejects a pending request without adding a member" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    joiner = create(:user)
    request = create(:join_request, conversation: conversation, account: joiner.account)

    expect(described_class.call(actor: owner.account, join_request: request)).to be_success
    expect(request.reload).to be_rejected
    expect(conversation.conversation_memberships.where(account: joiner.account)).to be_empty
  end

  it "forbids a member and refuses a resolved request" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    request = create(:join_request, conversation: conversation, account: create(:account))

    expect(described_class.call(actor: member.account, join_request: request).error_code).to eq(:forbidden)
    request.update!(status: "approved")
    expect(described_class.call(actor: owner.account, join_request: request).error_code).to eq(:conflict)
  end

  it "rejects a bot requester without a realtime notify" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    request = create(:join_request, conversation: conversation, account: create(:bot).account)

    expect(described_class.call(actor: owner.account, join_request: request)).to be_success
    expect(request.reload).to be_rejected
  end
end
