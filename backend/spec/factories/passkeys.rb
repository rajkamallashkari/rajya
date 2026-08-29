FactoryBot.define do
  factory :passkey do
    user
    sequence(:webauthn_credential_id) { |n| "credential-#{n}" }
    public_key { "public-key-bytes" }
    nickname { "Laptop" }
  end
end
