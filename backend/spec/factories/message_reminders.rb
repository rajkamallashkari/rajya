FactoryBot.define do
  factory :message_reminder do
    account
    message
    remind_at { 1.hour.from_now }
  end
end
