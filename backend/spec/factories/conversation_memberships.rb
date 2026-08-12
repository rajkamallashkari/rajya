FactoryBot.define do
  factory :conversation_membership do
    conversation
    account
    joined_at { Time.current }
  end
end
