FactoryBot.define do
  factory :user do
    account
    sequence(:email) { |n| "user#{n}@example.com" }
  end
end
