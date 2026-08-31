# WebRTC signaling (TARGET §3 / BR-69). Subscribe authorizes a human onto
# their stream; relay and lifecycle actions go through Calls::Signal so a
# non-participant cannot offer SDP to a call. `unsubscribed` during ring
# cancels the initiator's call (BR-66).
class SignalingChannel < ApplicationCable::Channel
  def subscribed
    unless current_account.human? && FeatureFlag.enabled?(:webrtc_calls, account: current_account)
      reject
      return
    end

    @tracking = true
    stream_from Realtime.signaling_stream(current_account.id)
  end

  def unsubscribed
    return unless @tracking

    Calls::CancelOnDisconnect.call(account: current_account)
  end

  def signal(data) = run("signal", data)
  def join(data) = run("join", data)
  def leave(data) = run("leave", data)
  def dismiss(data) = run("dismiss", data)
  def heartbeat(data) = run("heartbeat", data)
  def busy(data) = run("busy", data)
  def mute_state(data) = run("mute_state", data)

  private

  def run(action, data)
    return unless @tracking

    Calls::Signal.call(account: current_account, action: action, data: data)
  end
end
