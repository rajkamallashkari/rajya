FactoryBot.define do
  factory :message_contact do
    message
    display_name { "Ada" }
    sequence(:position)
  end
end
