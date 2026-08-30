FactoryBot.define do
  factory :poll_option do
    poll
    sequence(:position)
    sequence(:label) { |n| "Option #{n}" }
  end
end
