FactoryBot.define do
  factory :saved_reply do
    account
    sequence(:shortcut) { |n| "/omw#{n}" }
    body { "On my way" }
  end
end
