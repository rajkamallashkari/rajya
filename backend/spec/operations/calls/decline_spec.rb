require "rails_helper"

RSpec.describe Calls::Decline do
  def ringing_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ initiator, callee, conversation, call ]
  end

  it "finalizes a 1:1 ringing call as declined" do
    _initiator, callee, conversation, call = ringing_direct
    captured = capture_cable

    expect(described_class.call(account: callee.account, call: call).value.call.status).to eq("declined")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("call_declined")
    bubble = Message.where(conversation: conversation, kind: "system").find { |row| row.metadata["call_id"] == call.id }
    expect(bubble.system_event).to eq("call_missed")
  end

  it "misses a group call when the last pending callee declines" do
    enable_webrtc_calls!
    owner = create(:user)
    first = create(:user)
    second = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ first.account, second.account ])
    call = Calls::Create.call(account: owner.account, conversation: conversation, kind: "audio").value.call
    described_class.call(account: first.account, call: call)

    expect(described_class.call(account: second.account, call: call.reload).value.call.status).to eq("missed")
  end

  it "leaves a group ringing when another callee is still pending" do
    enable_webrtc_calls!
    owner = create(:user)
    first = create(:user)
    second = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ first.account, second.account ])
    call = Calls::Create.call(account: owner.account, conversation: conversation, kind: "audio").value.call

    expect(described_class.call(account: first.account, call: call).value.call.status).to eq("ringing")
    expect(call.reload.participant_for(first.account.id).status).to eq("declined")
  end

  it "forbids decline when the participant row disappeared" do
    _initiator, callee, _conversation, call = ringing_direct
    allow(call).to receive_messages(includes_account?: true, participant_for: nil)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:forbidden)
  end

  it "rejects a missing flag, a stranger, and a non-ringing call" do
    _initiator, callee, _conversation, call = ringing_direct
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:not_found)

    enable_webrtc_calls!
    expect(described_class.call(account: create(:user).account, call: call).error_code).to eq(:forbidden)
    call.update!(status: "active", started_at: Time.current)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:conflict)
  end
end
