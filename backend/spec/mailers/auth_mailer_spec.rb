require "rails_helper"

RSpec.describe AuthMailer do
  let(:user) { create(:user, email: "ada@example.com") }

  before { ActionMailer::Base.deliveries.clear }

  it "sends the OTP in the subject and body" do
    mail = described_class.email_otp(user: user, otp: "123456")

    expect(mail.to).to eq([ user.email ])
    expect(mail.subject).to include("123456")
    expect(mail.body.encoded).to include("123456")
  end

  it "embeds a frontend magic-link URL" do
    mail = described_class.magic_link(user: user, token: "tok")

    expect(mail.subject).to eq(Catalog.t("mailers.auth.magic_link.subject"))
    expect(mail.body.encoded).to include("/auth/magic?token=tok")
  end

  it "embeds a frontend password-reset URL" do
    mail = described_class.password_reset(user: user, token: "tok")

    expect(mail.body.encoded).to include("/auth/reset-password?token=tok")
  end
end
