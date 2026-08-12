FactoryBot.define do
  factory :bot do
    account factory: %i[account bot_kind]
    persona_prompt { "You are a helpful assistant." }
  end
end
