FactoryBot.define do
  factory :pinned_message do
    conversation
    message
    pinned_by_account factory: %i[account]
  end
end
