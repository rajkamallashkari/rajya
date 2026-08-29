FactoryBot.define do
  factory :account do
    sequence(:username) { |n| "account#{n}" }
    display_name { "Account #{username}" }
    kind { "human" }

    trait :bot_kind do
      kind { "bot" }
    end

    trait :deactivated do
      deactivated_at { Time.current }
    end
  end
end
