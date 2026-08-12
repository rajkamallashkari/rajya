FactoryBot.define do
  factory :ai_usage_event do
    capability { "chat_completion" }
    provider { "openai" }
    model { "gpt-4" }
    status { "success" }
  end
end
