module AuthHelpers
  def bearer_token_for(user)
    Auth::Token.encode(user)
  end

  def auth_headers_for(user)
    { "Authorization" => "Bearer #{bearer_token_for(user)}" }
  end
end
