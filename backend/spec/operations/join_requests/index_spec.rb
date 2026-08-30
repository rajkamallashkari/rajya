require "rails_helper"

RSpec.describe JoinRequests::Index do
  it "returns unexpired pending requests in arrival order" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    first = create(:join_request, conversation: conversation, account: create(:account), created_at: 2.minutes.ago)
    second = create(:join_request, conversation: conversation, account: create(:account), created_at: 1.minute.ago)
    create(:join_request, :rejected, conversation: conversation, account: create(:account))

    expect(described_class.call(conversation: conversation).value.join_requests).to eq([ first, second ])
  end
end
