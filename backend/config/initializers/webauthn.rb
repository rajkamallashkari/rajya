# WebAuthn RP is the SPA origin (session 2.3). Challenges are cached in
# Rails.cache keyed by nonce / user id — the SPA authenticates with a Bearer
# JWT and never sends a session cookie (legacy passkey_auth_controller).
# Defaults match CorsOrigins::LOCALHOST; FRONTEND_ORIGIN is the P0 env var.
WebAuthn.configure do |config|
  origin = ENV.fetch("WEBAUTHN_ORIGIN") { ENV.fetch("FRONTEND_ORIGIN", "http://localhost:5173") }
  extra = ENV["WEBAUTHN_ALLOWED_ORIGINS"]
  config.allowed_origins = extra.present? ? extra.split(",") : [ origin ]
  config.rp_name = ENV.fetch("WEBAUTHN_RP_NAME", "Rajya")
  config.rp_id = ENV.fetch("WEBAUTHN_RP_ID") { URI.parse(origin).host }
end
