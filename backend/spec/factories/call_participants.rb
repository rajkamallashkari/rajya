FactoryBot.define do
  factory :call_participant do
    call
    account
    status { "invited" }
  end
end
