FactoryBot.define do
  factory :call do
    conversation
    initiator_account factory: %i[account]
    kind { "audio" }
    status { "ringing" }
  end
end
