FactoryBot.define do
  factory :session do
    user
    jti { SecureRandom.uuid }
    last_seen_at { Time.current }
    expires_at { Settings.fetch(:session_lifetime).seconds.from_now }
    user_agent { "RajyaSpec/1.0" }
    ip { "127.0.0.1" }

    trait :revoked do
      revoked_at { Time.current }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end
  end
end
