FactoryBot.define do
  factory :sticker_pack do
    sequence(:slug) { |n| "pack-#{n}" }
    sequence(:name) { |n| "Pack #{n}" }
    kind { "sticker" }
    association :owner_account, factory: :account

    trait :system do
      owner_account { nil }
    end

    trait :published do
      published_at { Time.current }
    end

    trait :emoji do
      kind { "emoji" }
    end
  end
end
