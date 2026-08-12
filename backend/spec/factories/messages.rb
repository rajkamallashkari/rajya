FactoryBot.define do
  factory :message do
    conversation
    sender_account { association :account }
    kind { "text" }
    body { "Hello!" }
    sequence(:position)
    sequence(:revision)
  end
end
