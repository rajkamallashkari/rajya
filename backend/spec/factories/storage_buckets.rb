FactoryBot.define do
  factory :storage_bucket do
    sequence(:service_name) { |n| "bucket-#{n}" }
  end
end
