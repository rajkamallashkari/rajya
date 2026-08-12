FactoryBot.define do
  factory :bot_request do
    requester_account factory: %i[account]
    kind { "create" }
  end
end
