require "rails_helper"

RSpec.describe VerificationCode do
  let(:user) { create(:user) }

  it "reports expired when expires_at is in the past" do
    code = build(:verification_code, user: user, expires_at: 1.minute.ago)

    expect(code).to be_expired
    expect(described_class.active).not_to include(code)
  end

  it "consumes the row and records attempts" do
    code = create(:verification_code, user: user)

    expect(code).not_to be_consumed
    code.record_attempt!
    code.consume!

    expect(code.reload.attempts).to eq(1)
    expect(code).to be_consumed
  end

  it "scopes OTP rows to bcrypt digests" do
    otp = create(:verification_code, user: user, code_digest: BCrypt::Password.create("000000"))
    token = create(:verification_code, user: user, purpose: "password_reset",
                                       code_digest: Digest::SHA256.hexdigest("raw"))

    expect(described_class.otp).to include(otp)
    expect(described_class.otp).not_to include(token)
  end
end
