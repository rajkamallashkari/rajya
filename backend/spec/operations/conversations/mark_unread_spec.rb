require "rails_helper"

RSpec.describe Conversations::MarkUnread do
  it "sets manually_unread_at on the membership only (NR-22)" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    described_class.call(account: user.account, conversation: conversation)

    expect(Conversations::View.for(conversation.reload, user.account).membership.manually_unread_at).to be_present
    expect(Conversations::View.for(conversation, peer).membership.manually_unread_at).to be_nil
    described_class.call(account: user.account, conversation: conversation.reload)
    expect(Conversations::View.for(conversation.reload, user.account).membership.manually_unread_at).to be_present
  end

  it "forbids a stranger" do
    conversation = create_direct_between(create(:account), create(:account))
    expect(described_class.call(account: create(:user).account, conversation: conversation).error_code)
      .to eq(:forbidden)
  end

  it "returns not_found when organize is allowed but membership is missing" do
    conversation = create_direct_between(create(:account), create(:account))
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, organize?: true))
    expect(described_class.call(account: stranger, conversation: conversation).error_code).to eq(:not_found)
  end
end
