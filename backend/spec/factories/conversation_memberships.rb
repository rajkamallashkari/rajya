FactoryBot.define do
  factory :conversation_membership do
    conversation
    account
    joined_at { Time.current }

    trait :admin do
      role { "admin" }
    end

    trait :owner do
      role { "owner" }
    end

    trait :left do
      status { "left" }
    end

    trait :removed do
      status { "removed" }
    end
  end
end
