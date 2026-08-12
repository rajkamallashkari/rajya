FactoryBot.define do
  factory :verification_code do
    user
    purpose { "login" }
    channel { "email" }
    sequence(:destination) { |n| "verify#{n}@example.com" }
    code_digest { "digest" }
    expires_at { 1.hour.from_now }
  end
end
