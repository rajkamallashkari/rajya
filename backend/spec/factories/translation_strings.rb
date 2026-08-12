FactoryBot.define do
  factory :translation_string do
    sequence(:key) { |n| "greeting.key_#{n}" }
    locale { "en" }
    value { "Hello" }
  end
end
