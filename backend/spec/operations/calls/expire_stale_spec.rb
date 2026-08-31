require "rails_helper"

RSpec.describe Calls::ExpireStale do
  def ringing_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ initiator, callee, conversation, call ]
  end

  it "misses a stale ringing call and emits call_missed (BR-64, BR-65)" do
    _initiator, _callee, conversation, call = ringing_direct
    call.update_columns(created_at: (Settings.fetch(:ring_timeout) + 1).seconds.ago)
    captured = capture_cable

    described_class.call
    expect(call.reload.status).to eq("missed")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("call_missed")
    expect(captured.map { |row| row.dig(:payload, "type") }).not_to include("call_cancelled")
    bubble = Message.where(conversation: conversation, kind: "system").find { |row| row.metadata["call_id"] == call.id }
    expect(bubble.system_event).to eq("call_missed")
  end

  it "ends a stale active call without a heartbeat (BR-64)" do
    _initiator, callee, _conversation, call = ringing_direct
    Calls::Accept.call(account: callee.account, call: call)
    call.update_columns(updated_at: (Settings.fetch(:call_heartbeat_timeout) + 1).seconds.ago)
    captured = capture_cable

    described_class.call
    expect(call.reload.status).to eq("ended")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("call_ended")
  end

  it "releases orphaned live participants on terminal calls" do
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = create(:call, :missed, conversation: conversation, initiator_account: initiator.account)
    create(:call_participant, :joined, call: call, account: initiator.account)
    create(:call_participant, call: call, account: callee.account, status: "ringing")

    described_class.call
    expect(call.call_participants.where(status: CallParticipant::LIVE)).to be_empty
  end

  it "skips a row that is already terminal when swept" do
    missed = create(:call, :missed)
    allow(Call).to receive_messages(stale_ringing: Call.where(id: missed.id), stale_active: Call.none)

    expect { described_class.call }.not_to change { missed.reload.updated_at }
  end
end
