require "rails_helper"

RSpec.describe Calls::SetScreenSharing do
  def active_direct
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "video").value.call
    Calls::Accept.call(account: callee.account, call: call)
    [ initiator, callee, call.reload ]
  end

  it "persists the flag and notifies the peer on a 1:1 call (NR-47)" do
    initiator, _callee, call = active_direct
    captured = capture_cable

    result = described_class.call(account: initiator.account, call: call, sharing: true)
    expect(result).to be_success
    expect(call.participant_for(initiator.account.id).reload.is_screen_sharing).to be(true)
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("screen_share")
    expect(captured.find { |row| row.dig(:payload, "type") == "screen_share" }.dig(:payload, "sharing")).to be(true)
  end

  it "clears the flag when sharing stops and leaves the call active" do
    initiator, _callee, call = active_direct
    described_class.call(account: initiator.account, call: call, sharing: true)

    result = described_class.call(account: initiator.account, call: call.reload, sharing: false)
    expect(result).to be_success
    expect(call.participant_for(initiator.account.id).reload.is_screen_sharing).to be(false)
    expect(call.reload.status).to eq("active")
  end

  it "rejects screen share in a group call" do
    enable_webrtc_calls!
    owner = create(:user)
    first = create(:user)
    second = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ first.account, second.account ])
    call = Calls::Create.call(account: owner.account, conversation: conversation, kind: "video").value.call
    Calls::Accept.call(account: first.account, call: call)
    Calls::Accept.call(account: second.account, call: call.reload)

    result = described_class.call(account: owner.account, call: call.reload, sharing: true)
    expect(result.error_code).to eq(:validation_failed)
    expect(result.error_details[:reason]).to eq("screen_share_group")
    expect(call.participant_for(owner.account.id).reload.is_screen_sharing).to be(false)
  end

  it "rejects a missing flag, a stranger, a ringing call, and a non-joined participant" do
    initiator, callee, call = active_direct
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, call: call, sharing: true).error_code).to eq(:not_found)

    enable_webrtc_calls!
    expect(described_class.call(account: create(:user).account, call: call, sharing: true).error_code).to eq(:forbidden)

    call.update!(status: "ringing")
    expect(described_class.call(account: initiator.account, call: call, sharing: true).error_code).to eq(:conflict)

    call.update!(status: "active")
    call.participant_for(callee.account.id).update!(status: "left")
    expect(described_class.call(account: callee.account, call: call.reload, sharing: true).error_code).to eq(:forbidden)
  end
end
