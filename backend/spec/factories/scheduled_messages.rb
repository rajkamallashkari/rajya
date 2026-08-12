FactoryBot.define do
  factory :scheduled_message do
    conversation
    sender_account factory: %i[account]
    body { "Reminder!" }
    scheduled_at { 1.day.from_now }
  end
end
