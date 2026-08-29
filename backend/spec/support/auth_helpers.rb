module AuthHelpers
  def bearer_token_for(user)
    Auth::Session.issue(user).token
  end

  def auth_headers_for(user)
    { "Authorization" => "Bearer #{bearer_token_for(user)}" }
  end
end
