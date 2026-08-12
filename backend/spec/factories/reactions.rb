FactoryBot.define do
  factory :reaction do
    message
    account
    emoji { "👍" }
  end
end
