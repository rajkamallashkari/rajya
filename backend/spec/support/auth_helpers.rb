module AuthHelpers
  def bearer_token_for(user)
    Auth::Session.issue(user).token
  end

  def auth_headers_for(user)
    { "Authorization" => "Bearer #{bearer_token_for(user)}" }
  end

  def impersonation_headers_for(admin, account)
    issued = Auth::Session.issue(admin)
    jti = Auth::Token.decode(issued.token).fetch("jti")
    session = admin.sessions.find_by!(jti: jti)
    token = Auth::Token.encode(
      admin,
      jti: session.jti,
      expires_at: session.expires_at,
      account_id: account.id,
      impersonator_id: admin.id
    )
    { "Authorization" => "Bearer #{token}" }
  end
end
