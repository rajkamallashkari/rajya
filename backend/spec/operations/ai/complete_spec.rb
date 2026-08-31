require "rails_helper"

RSpec.describe Ai::Complete do
  it "returns not_found when the capability flag is off" do
    account = create(:user).account
    create(:feature_flag, key: "ai_rewrite", description: FeatureFlagRegistry.description_for(:ai_rewrite),
                           enabled: false)

    expect(described_class.call(account: account, capability: :rewrite, messages: []).error_code).to eq(:not_found)
  end

  it "maps rate_limited and blank upstream results" do
    account = create(:user).account
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "rate_limited", provider: "none", model: "none")
    )
    expect(described_class.call(account: account, capability: :rewrite, messages: [ { role: "user", content: "x" } ])
                          .error_code).to eq(:rate_limited)

    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "  ", status: "success", provider: "groq", model: "llama")
    )
    expect(described_class.call(account: account, capability: :rewrite, messages: [ { role: "user", content: "x" } ])
                          .error_code).to eq(:upstream_failed)
  end
end
