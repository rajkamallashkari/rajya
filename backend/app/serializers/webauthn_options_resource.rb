# WebAuthn ceremony payloads are a protocol document, not a domain model.
# The serializer forwards the gem's as_json (plus nonce on the login path)
# so the client can pass it to navigator.credentials unchanged.
class WebauthnOptionsResource < ApplicationResource
  def to_h
    object.deep_stringify_keys
  end
end
