FactoryBot.define do
  factory :web_push_subscription do
    user
    sequence(:endpoint) { |n| "https://push.example.com/subscription/#{n}" }
    p256dh { "p256dh-key" }
    auth { "auth-secret" }
  end
end
