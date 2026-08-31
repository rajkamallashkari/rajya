require "rails_helper"

RSpec.describe Calls::Signal do
  include ActiveSupport::Testing::TimeHelpers
  def ringing_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ initiator, callee, call ]
  end

  it "relays an offer to a participant (BR-69)" do
    initiator, callee, call = ringing_direct
    captured = capture_cable
    described_class.call(
      account: initiator.account, action: "signal",
      data: { "call_id" => call.id, "type" => "offer", "to_account_id" => callee.account.id, "payload" => { "sdp" => "x" } }
    )

    expect(captured).to include(
      hash_including(payload: hash_including("type" => "offer", "from_account_id" => initiator.account.id))
    )
  end

  it "refuses a non-participant relay (BR-69)" do
    initiator, _callee, call = ringing_direct
    expect(
      described_class.call(
        account: initiator.account, action: "signal",
        data: { "call_id" => call.id, "type" => "offer", "to_account_id" => create(:user).account.id }
      ).error_code
    ).to eq(:forbidden)
  end

  it "rejects self-relay as forbidden" do
    initiator, _callee, call = ringing_direct
    expect(
      described_class.call(
        account: initiator.account, action: "signal",
        data: { "call_id" => call.id, "type" => "offer", "to_account_id" => initiator.account.id }
      ).error_code
    ).to eq(:forbidden)
  end

  it "rejects a hangup type and an unknown action as validation failed" do
    initiator, _callee, call = ringing_direct
    hangup = described_class.call(
      account: initiator.account, action: "signal",
      data: { "call_id" => call.id, "type" => "hangup", "to_account_id" => initiator.account.id }
    )
    wave = described_class.call(account: initiator.account, action: "wave", data: { "call_id" => call.id })
    expect([ hangup.error_code, wave.error_code ]).to eq(%i[validation_failed validation_failed])
  end

  it "rejects a missing call as not found" do
    initiator, _callee, _call = ringing_direct
    expect(described_class.call(account: initiator.account, action: "signal", data: { "call_id" => 0 }).error_code)
      .to eq(:not_found)
  end

  it "rejects signaling when the flag is off" do
    initiator, _callee, call = ringing_direct
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, action: "join", data: { "call_id" => call.id }).error_code)
      .to eq(:not_found)
  end

  it "announces join, dismiss, mute, busy, and leave" do # rubocop:disable RSpec/ExampleLength
    initiator, callee, call = ringing_direct
    captured = capture_cable
    described_class.call(account: callee.account, action: "join", data: { "call_id" => call.id })
    described_class.call(account: callee.account, action: "dismiss", data: { "call_id" => call.id, "reason" => "silenced" })
    described_class.call(account: initiator.account, action: "dismiss", data: { "call_id" => call.id })
    described_class.call(
      account: callee.account, action: "mute_state",
      data: { "call_id" => call.id, "mic_on" => true, "cam_on" => false }
    )
    described_class.call(account: callee.account, action: "busy", data: { "call_id" => call.id })
    described_class.call(account: callee.account, action: "leave", data: { "call_id" => call.id })

    types = captured.map { |row| row.dig(:payload, "type") }
    expect(types).to include("user_joined", "call_dismissed", "mute_state", "busy", "user_left")
    expect(call.reload.participant_for(callee.account.id).status).to eq("busy")
  end

  it "touches an active call on heartbeat and refuses busy from a joined participant" do
    initiator, callee, call = ringing_direct
    Calls::Accept.call(account: callee.account, call: call)
    freeze_time do
      described_class.call(account: initiator.account, action: "heartbeat", data: { "call_id" => call.id })
      expect(call.reload.updated_at).to eq(Time.current)
    end
    expect(described_class.call(account: callee.account, action: "busy", data: { "call_id" => call.id }).error_code)
      .to eq(:conflict)
  end

  it "does not touch a ringing call on heartbeat" do
    initiator, _callee, call = ringing_direct
    before = call.updated_at
    described_class.call(account: initiator.account, action: "heartbeat", data: { "call_id" => call.id })
    expect(call.reload.updated_at).to eq(before)
  end

  it "leaves a joined participant" do
    _initiator, callee, call = ringing_direct
    Calls::Accept.call(account: callee.account, call: call)
    described_class.call(account: callee.account, action: "leave", data: { "call_id" => call.id })
    expect(call.reload.participant_for(callee.account.id).status).to eq("left")
  end

  it "announces leave when the participant row is gone" do
    initiator, _callee, call = ringing_direct
    allow(Call).to receive(:find_by).and_return(call)
    allow(call).to receive_messages(includes_account?: true, participant_for: nil)
    expect(described_class.call(account: initiator.account, action: "leave", data: { "call_id" => call.id }))
      .to be_success
  end

  it "no-ops leave for a ringing row" do
    _initiator, callee, call = ringing_direct
    described_class.call(account: callee.account, action: "leave", data: { "call_id" => call.id })
    expect(call.reload.participant_for(callee.account.id).status).to eq("ringing")
  end
end
