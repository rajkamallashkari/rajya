FactoryBot.define do
  factory :poll_vote do
    poll
    poll_option { association :poll_option, poll: poll }
    account
  end
end
