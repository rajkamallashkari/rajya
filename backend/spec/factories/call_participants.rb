FactoryBot.define do
  factory :call_participant do
    call
    account
    status { "ringing" }

    trait :joined do
      status { "joined" }
      joined_at { Time.current }
    end

    trait :busy do
      status { "busy" }
    end
  end
end

