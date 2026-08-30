FactoryBot.define do
  factory :group_invite do
    conversation
    created_by_account factory: %i[account]
    sequence(:token) { |n| "invite-token-#{n}" }
    requires_approval { false }
    uses_count { 0 }

    trait :approval do
      requires_approval { true }
    end
  end
end
