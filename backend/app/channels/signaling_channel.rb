# WebRTC signaling scaffold (TARGET §3). Relay actions arrive with calls in a
# later phase; this session only authorizes a human onto their signaling stream.
class SignalingChannel < ApplicationCable::Channel
  def subscribed
    unless current_account.human?
      reject
      return
    end

    stream_from Realtime.signaling_stream(current_account.id)
  end
end
