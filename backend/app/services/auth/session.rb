# The success payload every login path returns — JWT plus the participant
# and human rows the client needs to bootstrap. Serialised by SessionResource.
# Each issue persists a `sessions` row whose `jti` is embedded in the token
# so that device can be revoked without bumping `credentials_epoch` (S-20).
module Auth
  class Session
    Payload = Struct.new(:token, :account, :user, keyword_init: true)

    def self.issue(user, device_label: nil, user_agent: nil, ip: nil)
      jti = SecureRandom.uuid
      expires_at = Settings.fetch(:session_lifetime).seconds.from_now
      ::Session.create!(
        user: user,
        jti: jti,
        device_label: device_label,
        user_agent: user_agent || RequestContext.user_agent,
        ip: ip || RequestContext.ip,
        last_seen_at: Time.current,
        expires_at: expires_at
      )
      Payload.new(token: Token.encode(user, jti: jti, expires_at: expires_at), account: user.account, user: user)
    end
  end
end
