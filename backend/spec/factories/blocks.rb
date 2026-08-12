FactoryBot.define do
  factory :block do
    blocker_account factory: %i[account]
    blocked_account factory: %i[account]
  end
end
