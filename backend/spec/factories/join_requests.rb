FactoryBot.define do
  factory :join_request do
    conversation
    account
    status { "pending" }

    trait :approved do
      status { "approved" }
      reviewed_at { Time.current }
    end

    trait :rejected do
      status { "rejected" }
      reviewed_at { Time.current }
    end
  end
end
