FactoryBot.define do
  factory :feature_flag do
    sequence(:key) { |n| "flag_#{n}" }
    description { "A feature flag." }
    enabled { false }
    rollout { {} }
  end
end
