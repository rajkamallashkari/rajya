require "rails_helper"

RSpec.describe Calls::Cancel do
  def ringing_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ initiator, callee, call ]
  end

  it "misses a ringing call when the initiator cancels" do
    initiator, _callee, call = ringing_direct
    captured = capture_cable

    expect(described_class.call(account: initiator.account, call: call).value.call.status).to eq("missed")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("call_cancelled")
  end

  it "rejects a missing flag, a callee, and an active call" do
    initiator, callee, call = ringing_direct
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, call: call).error_code).to eq(:not_found)

    enable_webrtc_calls!
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:forbidden)
    call.update!(status: "active", started_at: Time.current)
    expect(described_class.call(account: initiator.account, call: call).error_code).to eq(:conflict)
  end
end
