FactoryBot.define do
  factory :storage_bucket do
    sequence(:service_name) { |n| "bucket-#{n}" }
    status { "active" }
    priority { 0 }
    used_bytes { 0 }
    capacity_bytes { 9_999_999_999 }

    trait :test_disk do
      service_name { "test" }
    end

    trait :full do
      status { "full" }
      used_bytes { 9_999_999_999 }
    end

    trait :failed do
      status { "failed" }
    end

    trait :disabled do
      status { "disabled" }
    end

    trait :nearly_full do
      used_bytes { 9_999_999_990 }
    end
  end
end
