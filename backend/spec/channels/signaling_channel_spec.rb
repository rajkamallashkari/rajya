require "rails_helper"

RSpec.describe SignalingChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes a human to their signaling stream when calls are enabled" do
    enable_webrtc_calls!
    subscribe

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.signaling_stream(user.account.id))
  end

  it "rejects a bot" do
    enable_webrtc_calls!
    bot = create(:bot)
    stub_connection current_user: user, current_account: bot.account
    subscribe

    expect(subscription).to be_rejected
  end

  it "rejects when the feature flag is off" do
    subscribe
    expect(subscription).to be_rejected
  end

  it "cancels a ringing call when the initiator unsubscribes (BR-66)" do
    enable_webrtc_calls!
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    call = Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
    subscribe

    unsubscribe
    expect(call.reload.status).to eq("missed")
  end

  it "does not cancel when subscribe was rejected" do
    allow(Calls::CancelOnDisconnect).to receive(:call)
    subscribe
    described_class.new(connection, {}).unsubscribed

    expect(subscription).to be_rejected
    expect(Calls::CancelOnDisconnect).not_to have_received(:call)
  end

  it "does not relay SDP from a non-participant (BR-69)" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    subscribe
    captured = capture_cable

    perform :signal, call_id: call.id, type: "offer", to_account_id: callee.account.id, payload: { sdp: "x" }
    expect(captured.select { |row| row.dig(:payload, "type") == "offer" }).to be_empty
  end

  it "relays SDP between participants" do
    enable_webrtc_calls!
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    call = Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
    subscribe
    captured = capture_cable

    perform :signal, call_id: call.id, type: "answer", to_account_id: peer.account.id, payload: { sdp: "a" }
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("answer")
  end

  it "runs join, dismiss, heartbeat, mute_state, busy, and leave" do # rubocop:disable RSpec/ExampleLength
    enable_webrtc_calls!
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    call = Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
    subscribe
    captured = capture_cable

    perform :join, call_id: call.id
    perform :dismiss, call_id: call.id
    perform :heartbeat, call_id: call.id
    perform :mute_state, call_id: call.id, mic_on: false, cam_on: true
    perform :busy, call_id: call.id
    perform :leave, call_id: call.id
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("user_joined", "call_dismissed", "mute_state")
  end

  it "skips actions when tracking was never set" do
    enable_webrtc_calls!
    subscribe
    subscription.instance_variable_set(:@tracking, nil)
    allow(Calls::Signal).to receive(:call)
    perform :join, call_id: 1
    expect(Calls::Signal).not_to have_received(:call)
  end
end
