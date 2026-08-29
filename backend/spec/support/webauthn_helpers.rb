require "webauthn/fake_client"

module WebauthnHelpers
  def webauthn_client
    WebAuthn::FakeClient.new(Auth::Webauthn.origin)
  end

  def webauthn_challenge(options)
    options[:challenge] || options["challenge"]
  end

  def webauthn_attestation(user, client)
    options = Auth::Webauthn.registration_options(user: user, exclude: [])
    client.create(challenge: webauthn_challenge(options), user_verified: true)
  end

  def register_passkey!(user, client, nickname: "Laptop")
    Auth::Passkeys::Register.call(
      user: user,
      credential: webauthn_attestation(user, client),
      nickname: nickname
    ).value
  end

  def webauthn_assertion(client, challenge)
    client.get(challenge: challenge, user_verified: true)
  end
end
