require "rails_helper"

RSpec.describe Ai::TranslateText do
  it "translates arbitrary text without a message" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: account, text: "Hola", target_language: "en")
    expect(result.value.text).to eq("Hello")
  end

  it "rejects blank text" do
    expect(described_class.call(account: create(:user).account, text: " ", target_language: "en").error_code)
      .to eq(:validation_failed)
  end

  it "honours an explicit source language" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: account, text: "Hola", target_language: "en", source_language: "es")
    expect(result.value.source_language).to eq("es")
  end

  it "returns the upstream error when completion fails" do
    account = create(:user).account
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))
    expect(described_class.call(account: account, text: "Hola", target_language: "en").error_code)
      .to eq(:upstream_failed)
  end
end
