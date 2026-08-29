require "rails_helper"

RSpec.describe PhoneVerifications::Inbound do
  it "confirms a matching inbound message" do
    configure_whatsapp!
    user = create(:user)
    raw = "654321"
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest(raw),
                                        expires_at: 1.hour.from_now)
    body = whatsapp_inbound(from: "15551239999", text: raw)

    result = described_class.call(raw_body: body, signature: whatsapp_signature(body))
    expect(result).to be_success
    expect(user.reload.phone).to eq("15551239999")
  end

  it "rejects a bad signature and ignores invalid JSON" do
    configure_whatsapp!
    expect(described_class.call(raw_body: "{}", signature: "sha256=nope").error_code).to eq(:unauthenticated)
    body = "not-json"
    expect(described_class.call(raw_body: body, signature: whatsapp_signature(body))).to be_success
    array = "[]"
    expect(described_class.call(raw_body: array, signature: whatsapp_signature(array))).to be_success
  end
end
