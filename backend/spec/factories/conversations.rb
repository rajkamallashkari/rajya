FactoryBot.define do
  factory :conversation do
    kind { "group" }
    sequence(:title) { |n| "Group #{n}" }
    last_activity_at { Time.current }

    trait :direct do
      kind { "direct" }
      title { nil }
      sequence(:direct_key) { |n| "direct-#{n}" }
    end

    trait :channel do
      kind { "channel" }
      sequence(:title) { |n| "Channel #{n}" }
    end
  end
end
