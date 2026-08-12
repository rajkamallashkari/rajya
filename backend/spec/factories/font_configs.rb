FactoryBot.define do
  factory :font_config do
    sequence(:name) { |n| "Font #{n}" }
    font_family_value { "Inter, sans-serif" }
  end
end
