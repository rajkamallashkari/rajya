require "rails_helper"

RSpec.describe AiUsageEvent do
  it "accepts a fallback status for a skippable provider attempt" do
    event = build(:ai_usage_event, status: "fallback", capability: "bot_reply", provider: "groq", model: "llama")

    expect(event).to be_valid
  end

  it "rejects a status outside the schema check" do
    event = build(:ai_usage_event, status: "skipped")

    expect(event).not_to be_valid
  end
end
