require "rails_helper"

RSpec.describe Users::Emails::Change do
  it "issues an OTP to the new address" do
    user = create(:user, email: "old@example.com")
    result = described_class.call(user: user, email: "New@Example.com")

    expect(result).to be_success
    mail = ActionMailer::Base.deliveries.last
    expect(mail.to).to eq([ "new@example.com" ])
    expect(user.verification_codes.last.destination).to eq("new@example.com")
  end

  it "rejects blank, unchanged, and taken emails" do
    user = create(:user, email: "ada@example.com")
    create(:user, email: "taken@example.com")

    expect(described_class.call(user: user, email: " ").error_code).to eq(:validation_failed)
    expect(described_class.call(user: user, email: "ADA@example.com").error_code).to eq(:validation_failed)
    expect(described_class.call(user: user, email: "taken@example.com").error_code).to eq(:validation_failed)
  end
end
