# Online/offline presence (D-8 / TARGET §3). Subscribe/unsubscribe drive the
# cache counter; broadcasts are privacy-gated and never go to blocked accounts.
class PresenceChannel < ApplicationCable::Channel
  def subscribed
    unless current_account.human?
      reject
      return
    end

    @tracking = true
    stream_from Realtime.presence_stream(current_account.id)
    Presence::Connect.call(account: current_account)
  end

  def unsubscribed
    return unless @tracking

    Presence::Disconnect.call(account: current_account)
  end
end
