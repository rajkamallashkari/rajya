FactoryBot.define do
  factory :phone_verification_request do
    user
    code_digest { "digest" }
    expires_at { 1.hour.from_now }
  end
end
