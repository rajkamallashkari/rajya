require "rails_helper"

RSpec.describe Calls::CancelOnDisconnect do
  it "cancels a ringing call when the initiator disconnects (BR-66)" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call

    described_class.call(account: initiator.account)
    expect(call.reload.status).to eq("missed")
  end

  it "does not cancel when the callee disconnects or the call is active" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call

    described_class.call(account: callee.account)
    expect(call.reload.status).to eq("ringing")

    Calls::Accept.call(account: callee.account, call: call)
    described_class.call(account: initiator.account)
    expect(call.reload.status).to eq("active")
    expect(described_class.call(account: create(:user).account)).to be_success
  end
end
