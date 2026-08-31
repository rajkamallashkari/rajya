require "rails_helper"

RSpec.describe Ai::Translate do
  it "caches the translation on the message (BR-86)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
    )

    first = described_class.call(account: user.account, message: message, target_language: "en")
    second = described_class.call(account: user.account, message: message.reload, target_language: "en")

    expect(first.value).to have_attributes(text: "Hello", cached: false)
    expect(second.value).to have_attributes(text: "Hello", cached: true)
    expect(Ai::Complete).to have_received(:call).once
    expect(message.reload.metadata.dig("translations", "en", "text")).to eq("Hello")
  end

  it "skips the cache after an edit" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    message.update!(edited_at: Time.current, metadata: { "translations" => { "en" => { "text" => "stale" } } })
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hi", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, message: message, target_language: "en")

    expect(result.value.text).to eq("Hi")
    expect(result.value.cached).to be(false)
  end

  it "skips missing messages, blank languages, and non-hash metadata" do # rubocop:disable RSpec/ExampleLength
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    expect(described_class.call(account: user.account, message: nil, target_language: "en").error_code)
      .to eq(:not_found)
    expect(described_class.call(account: user.account, message: message, target_language: " ").error_code)
      .to eq(:validation_failed)

    message.update_columns(metadata: [])
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
    )
    result = described_class.call(account: user.account, message: message, target_language: "en")
    expect(result.value.cached).to be(false)
  end

  it "bypasses the cache when a source language is supplied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    message.update!(metadata: { "translations" => { "en" => { "text" => "Hello" } } })
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Hi", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(
      account: user.account, message: message, target_language: "en", source_language: "es"
    )
    expect(result.value).to have_attributes(text: "Hi", cached: false, source_language: "es")
  end

  it "returns not_found when translate is flagged off" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    create(:feature_flag, key: "ai_translate", description: FeatureFlagRegistry.description_for(:ai_translate),
                           enabled: false)
    expect(described_class.call(account: user.account, message: message, target_language: "en").error_code)
      .to eq(:not_found)
  end

  it "returns the upstream error when completion fails" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))
    expect(described_class.call(account: user.account, message: message, target_language: "en").error_code)
      .to eq(:upstream_failed)
  end
end
