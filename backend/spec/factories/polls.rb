FactoryBot.define do
  factory :poll do
    message
    question { "Lunch?" }

    trait :anonymous do
      is_anonymous { true }
    end

    trait :multiple do
      allows_multiple { true }
    end
  end
end
