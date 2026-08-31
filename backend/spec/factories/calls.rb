FactoryBot.define do
  factory :call do
    conversation
    initiator_account factory: %i[account]
    kind { "audio" }
    status { "ringing" }

    trait :active do
      status { "active" }
      started_at { Time.current }
    end

    trait :ended do
      status { "ended" }
      started_at { Time.current }
      ended_at { Time.current }
    end

    trait :missed do
      status { "missed" }
      ended_at { Time.current }
    end

    trait :declined do
      status { "declined" }
      ended_at { Time.current }
    end
  end
end
