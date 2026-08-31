require "rails_helper"

RSpec.describe Calls::Hangup do
  def active_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    Calls::Accept.call(account: callee.account, call: call)
    [ initiator, callee, conversation, call.reload ]
  end

  it "ends a 1:1 active call and records duration only when both timestamps exist (BR-68)" do
    initiator, _callee, conversation, call = active_direct
    call.update_columns(started_at: 2.minutes.ago)
    captured = capture_cable

    ended = described_class.call(account: initiator.account, call: call).value.call
    expect(ended.status).to eq("ended")
    expect(ended.duration_seconds).to be >= 0
    bubble = Message.where(conversation: conversation, kind: "system").find { |row| row.metadata["call_id"] == call.id }
    expect(bubble.system_event).to eq("call_ended")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("call_ended")
  end

  it "keeps a group call active until the last joined participant hangs up" do
    enable_webrtc_calls!
    owner = create(:user)
    first = create(:user)
    second = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ first.account, second.account ])
    call = Calls::Create.call(account: owner.account, conversation: conversation, kind: "audio").value.call
    Calls::Accept.call(account: first.account, call: call)
    Calls::Accept.call(account: second.account, call: call.reload)

    expect(described_class.call(account: first.account, call: call.reload).value.call.status).to eq("active")
    expect(described_class.call(account: second.account, call: call.reload).value.call.status).to eq("active")
    expect(described_class.call(account: owner.account, call: call.reload).value.call.status).to eq("ended")
  end

  it "ends a ringing call hung up by the initiator" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call

    expect(described_class.call(account: initiator.account, call: call).value.call.status).to eq("ended")
    expect(call.reload.duration_seconds).to be_nil
  end

  it "ends the call when the hangup row is already gone" do
    initiator, _callee, _conversation, call = active_direct
    allow(call).to receive_messages(includes_account?: true, participant_for: nil)
    expect(described_class.call(account: initiator.account, call: call).value.call.status).to eq("ended")
  end

  it "rejects a missing flag, a stranger, and a missed call" do
    initiator, _callee, _conversation, call = active_direct
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, call: call).error_code).to eq(:not_found)

    enable_webrtc_calls!
    expect(described_class.call(account: create(:user).account, call: call).error_code).to eq(:forbidden)
    call.update!(status: "missed", ended_at: Time.current)
    expect(described_class.call(account: initiator.account, call: call).error_code).to eq(:conflict)
  end
end
