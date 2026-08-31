FactoryBot.define do
  factory :bot_command do
    bot
    sequence(:name) { |n| "cmd#{n}" }
    description { "Does a thing" }
  end
end
