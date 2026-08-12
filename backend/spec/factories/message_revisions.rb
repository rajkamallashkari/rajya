FactoryBot.define do
  factory :message_revision do
    message
    body { "Previous body" }
    superseded_at { Time.current }
  end
end
