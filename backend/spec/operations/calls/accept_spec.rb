require "rails_helper"

RSpec.describe Calls::Accept do
  def ringing_pair
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ initiator, callee, call ]
  end

  it "transitions ringing to active and notifies others" do
    initiator, callee, call = ringing_pair
    captured = capture_cable

    result = described_class.call(account: callee.account, call: call)
    expect(result.value.call.status).to eq("active")
    expect(call.reload.participant_for(callee.account.id).status).to eq("joined")
    types = captured.map { |row| row.dig(:payload, "type") }
    expect(types).to include("call_accepted", "call_dismissed")
  end

  it "keeps a group call active when a second callee joins" do
    enable_webrtc_calls!
    owner = create(:user)
    first = create(:user)
    second = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ first.account, second.account ])
    call = Calls::Create.call(account: owner.account, conversation: conversation, kind: "audio").value.call
    described_class.call(account: first.account, call: call)

    expect(described_class.call(account: second.account, call: call.reload).value.call.status).to eq("active")
  end

  it "forbids accept when the participant row disappeared" do
    _initiator, callee, call = ringing_pair
    allow(call).to receive_messages(includes_account?: true, participant_for: nil)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:forbidden)
  end

  it "rejects a missing flag, a stranger, and a terminal call" do
    _initiator, callee, call = ringing_pair
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:not_found)

    enable_webrtc_calls!
    expect(described_class.call(account: create(:user).account, call: call).error_code).to eq(:forbidden)
    call.update!(status: "ended", ended_at: Time.current)
    expect(described_class.call(account: callee.account, call: call).error_code).to eq(:conflict)
  end
end
