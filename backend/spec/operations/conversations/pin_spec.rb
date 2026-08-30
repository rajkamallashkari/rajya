require "rails_helper"

RSpec.describe Conversations::Pin do
  def setup
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    [ user, peer, conversation ]
  end

  it "pins on the membership so the peer cannot see it (NR-21)" do
    user, peer, conversation = setup
    described_class.call(account: user.account, conversation: conversation)
    alice = Conversations::View.for(conversation.reload, user.account)
    bob = Conversations::View.for(conversation, peer)

    expect(alice.membership.pinned_at).to be_present
    expect(bob.membership.pinned_at).to be_nil
  end

  it "is idempotent and rejects pins past the configured cap" do
    user, _peer, conversation = setup
    first = described_class.call(account: user.account, conversation: conversation)
    second = described_class.call(account: user.account, conversation: conversation)
    expect(first).to be_success
    expect(second).to be_success

    stub_setting(:pinned_conversations_cap, 1)
    extra = create_direct_between(user.account, create(:account))
    expect(described_class.call(account: user.account, conversation: extra).error_code).to eq(:validation_failed)
  end

  it "forbids a stranger" do
    _user, _peer, conversation = setup
    expect(described_class.call(account: create(:user).account, conversation: conversation).error_code)
      .to eq(:forbidden)
  end

  it "returns not_found when organize is allowed but membership is missing" do
    _user, _peer, conversation = setup
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, organize?: true))
    expect(described_class.call(account: stranger, conversation: conversation).error_code).to eq(:not_found)
  end
end
