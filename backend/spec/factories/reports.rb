FactoryBot.define do
  factory :report do
    reporter_account factory: %i[account]
    subject_type { "account" }
    subject_id { create(:account).id }
    reason { "spam" }
    status { "pending" }

    trait :dismissed do
      status { "dismissed" }
      reviewed_at { Time.current }
    end

    trait :actioned do
      status { "actioned" }
      reviewed_at { Time.current }
    end
  end
end
