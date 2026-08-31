require "rails_helper"

RSpec.describe Calls::Active do
  it "returns the current live call after expiring stale rows" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call

    expect(described_class.call(account: initiator.account).value.call).to eq(call)
    expect(described_class.call(account: create(:user).account).value.call).to be_nil
  end

  it "self-heals a stale ringing call before reporting active" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    call.update_columns(created_at: (Settings.fetch(:ring_timeout) + 1).seconds.ago)

    expect(described_class.call(account: initiator.account).value.call).to be_nil
    expect(call.reload.status).to eq("missed")
  end

  it "rejects when the flag is off" do
    expect(described_class.call(account: create(:user).account).error_code).to eq(:not_found)
  end
end
