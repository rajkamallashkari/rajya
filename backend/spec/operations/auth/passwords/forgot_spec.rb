require "rails_helper"

RSpec.describe Auth::Passwords::Forgot do
  before { ActionMailer::Base.deliveries.clear }

  def disable_flag!
    create(:feature_flag, key: "email_password_auth",
                          description: FeatureFlagRegistry.description_for(:email_password_auth), enabled: false)
  end

  it "emails a reset token when the account exists" do
    user = create(:user, email: "ada@example.com")

    expect { described_class.call(email: user.email) }.to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(ActionMailer::Base.deliveries.last.to).to eq([ user.email ])
  end

  it "returns the same accepted payload for an unknown email (F-24)" do
    allow(Auth::Codes).to receive(:dummy_work).and_call_original
    existing = described_class.call(email: create(:user).email)
    missing = described_class.call(email: "nobody@example.com")

    expect(missing.value.accepted).to eq(existing.value.accepted)
    expect(Auth::Codes).to have_received(:dummy_work)
  end

  it "treats a blank email as a missing account (F-24)" do
    allow(Auth::Codes).to receive(:dummy_work).and_call_original

    expect(described_class.call(email: " ")).to be_success
    expect(Auth::Codes).to have_received(:dummy_work)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(email: "a@x.com").error_code).to eq(:not_found)
  end
end
