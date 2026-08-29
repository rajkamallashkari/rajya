FactoryBot.define do
  factory :user do
    account
    sequence(:email) { |n| "user#{n}@example.com" }

    trait :with_password do
      password { "password12" }
    end

    trait :google do
      sequence(:google_subject) { |n| "google-sub-#{n}" }
    end

    trait :admin do
      is_admin { true }
    end
  end
end
