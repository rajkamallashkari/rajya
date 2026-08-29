require "rails_helper"

RSpec.describe Whatsapp::VerifySubscription do
  it "returns the challenge when the token matches" do
    configure_whatsapp!(token: "verify-me")
    result = described_class.call(mode: "subscribe", token: "verify-me", challenge: "abc")

    expect(result.value).to eq("abc")
  end

  it "rejects a blank configured token, a non-subscribe mode, or a mismatch" do
    configure_whatsapp!(token: "")
    expect(described_class.call(mode: "subscribe", token: "", challenge: "x").error_code).to eq(:forbidden)

    configure_whatsapp!(token: "verify-me")
    expect(described_class.call(mode: "unsubscribe", token: "verify-me", challenge: "x").error_code).to eq(:forbidden)
    expect(described_class.call(mode: "subscribe", token: "nope", challenge: "x").error_code).to eq(:forbidden)
  end
end
