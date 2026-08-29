FactoryBot.define do
  factory :contact_nickname do
    owner_account factory: %i[account]
    target_account factory: %i[account]
    nickname { "Ada" }
  end
end
