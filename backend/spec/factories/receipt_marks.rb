FactoryBot.define do
  factory :receipt_mark do
    membership factory: %i[conversation_membership]
    kind { "read" }
    sequence(:position)
    occurred_at { Time.current }
  end
end
