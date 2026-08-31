require "rails_helper"

RSpec.describe Ai::Rewrite do
  it "rewrites a draft and parses follow-up chips" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(
        Ai::Runner::Result.new(
          text: "Hello team.\nCHIPS: punchy, warmer", status: "success", provider: "groq", model: "llama"
        )
      )
    )

    result = described_class.call(account: account, text: "hey guys", tones: [ "professional" ])

    expect(result.value.text).to eq("Hello team.")
    expect(result.value.suggested_chips).to eq(%w[punchy warmer])
  end

  it "rejects a blank draft and a request with no tone or instruction" do
    account = create(:user).account
    expect(described_class.call(account: account, text: "  ").error_code).to eq(:validation_failed)
    expect(described_class.call(account: account, text: "hello").error_code).to eq(:validation_failed)
  end

  it "rewrites with an instruction and no chips line" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hello.", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: account, text: "hey", instruction: "Make it formal")
    expect(result.value).to have_attributes(text: "Hello.", suggested_chips: [])
  end

  it "fails when the rewrite body is blank" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "CHIPS: casual", status: "success", provider: "groq", model: "llama"))
    )

    expect(described_class.call(account: account, text: "hey", tones: [ "casual" ]).error_code)
      .to eq(:upstream_failed)
  end

  it "returns the upstream error when completion fails" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))
    expect(described_class.call(account: account, text: "hey", tones: [ "casual" ]).error_code)
      .to eq(:upstream_failed)
  end
end
