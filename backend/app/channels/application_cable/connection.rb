module ApplicationCable
  # Authenticates every WebSocket the same way HTTP does: decode the JWT
  # (query `token=`, the transport browsers can set) and reject when
  # `credentials_epoch` is stale or the session `jti` is revoked (F-6, NR-44).
  # Identified by both the human and the participant so later channels can
  # authorize `current_account`.
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :current_account

    def connect
      context = Auth::Identity.from_cable(request)
      reject_unauthorized_connection unless context

      self.current_user = context.user
      self.current_account = context.account
      context.session.touch_last_seen!
    end
  end
end
