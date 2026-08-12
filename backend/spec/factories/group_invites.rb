FactoryBot.define do
  factory :group_invite do
    conversation
    created_by_account factory: %i[account]
    sequence(:token) { |n| "invite-token-#{n}" }
  end
end
