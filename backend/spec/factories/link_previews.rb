FactoryBot.define do
  factory :link_preview do
    sequence(:url) { |n| "https://example.com/page-#{n}" }
  end
end
