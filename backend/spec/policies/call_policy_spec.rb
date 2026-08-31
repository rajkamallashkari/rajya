require "rails_helper"

RSpec.describe CallPolicy do
  def ringing_call_for(user)
    enable_webrtc_calls!
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
  end

  it "allows a human participant to show and respond" do
    user = create(:user)
    policy = described_class.new(user.account, ringing_call_for(user))
    expect(%i[show? accept? decline? cancel? hangup?].map { |method| policy.public_send(method) }).to all(be true)
  end

  it "denies a stranger and a bot" do
    user = create(:user)
    call = ringing_call_for(user)
    expect(described_class.new(create(:user).account, call)).not_to be_show
    expect(described_class.new(create(:bot).account, call)).not_to be_show
  end

  it "allows ice and active for humans, not bots" do
    human = create(:user).account
    bot = create(:bot).account
    expect([ described_class.new(human, :call).ice_servers?, described_class.new(human, :call).active? ]).to all(be true)
    expect([ described_class.new(bot, :call).ice_servers?, described_class.new(bot, :call).active? ]).to all(be false)
  end
end
