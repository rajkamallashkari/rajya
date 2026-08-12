FactoryBot.define do
  factory :app_setting do
    sequence(:key) { |n| "setting.key_#{n}" }
    value { { "enabled" => true } }
    category { "general" }
  end
end
