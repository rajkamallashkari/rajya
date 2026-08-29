require "rails_helper"

RSpec.describe Users::Emails::Verify do
  it "applies the destination email and stamps email_verified_at" do
    user = create(:user, email: "old@example.com")
    _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "email_change", destination: "new@example.com")
    result = described_class.call(user: user, code: raw)

    expect(result).to be_success
    expect(user.reload.email).to eq("new@example.com")
    expect(user.email_verified_at).to be_present
  end

  it "rejects an invalid code" do
    user = create(:user)
    expect(described_class.call(user: user, code: "000000").error_code).to eq(:validation_failed)
  end

  it "rejects when the destination was taken after the code was issued" do
    user = create(:user, email: "old@example.com")
    _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "email_change", destination: "new@example.com")
    create(:user, email: "new@example.com")

    expect(described_class.call(user: user, code: raw).error_code).to eq(:validation_failed)
    expect(user.reload.email).to eq("old@example.com")
  end
end
