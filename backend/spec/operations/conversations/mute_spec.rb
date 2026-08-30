require "rails_helper"

RSpec.describe Conversations::Mute do
  def setup
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    [ user, peer, conversation ]
  end

  it "mutes on the membership so the peer is unaffected" do
    user, peer, conversation = setup
    duration = Array(Settings.fetch(:mute_durations)).first
    described_class.call(account: user.account, conversation: conversation, duration: duration)
    alice = Conversations::View.for(conversation.reload, user.account)
    bob = Conversations::View.for(conversation, peer)

    expect(alice.membership.muted_until).to be_within(1.second).of(duration.seconds.from_now)
    expect(bob.membership.muted_until).to be_nil
  end

  it "unmutes when duration is zero and rejects an unknown duration" do
    user, _peer, conversation = setup
    duration = Array(Settings.fetch(:mute_durations)).first
    described_class.call(account: user.account, conversation: conversation, duration: duration)
    described_class.call(account: user.account, conversation: conversation, duration: 0)

    expect(Conversations::View.for(conversation.reload, user.account).membership.muted_until).to be_nil
    expect(described_class.call(account: user.account, conversation: conversation, duration: 7).error_code)
      .to eq(:validation_failed)
  end

  it "forbids a stranger" do
    _user, _peer, conversation = setup
    expect(described_class.call(account: create(:user).account, conversation: conversation, duration: 0).error_code)
      .to eq(:forbidden)
  end

  it "returns not_found when organize is allowed but membership is missing" do
    _user, _peer, conversation = setup
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, organize?: true))
    expect(described_class.call(account: stranger, conversation: conversation, duration: 0).error_code)
      .to eq(:not_found)
  end
end
