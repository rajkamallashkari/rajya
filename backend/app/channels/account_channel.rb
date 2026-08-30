# Sidebar updates, receipts, invites, cross-conversation notifications
# (TARGET §3). Stream is the acting account — the connection identity, never a
# client-supplied id.
class AccountChannel < ApplicationCable::Channel
  def subscribed
    stream_from Realtime.account_stream(current_account.id)
  end
end
