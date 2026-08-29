require "rails_helper"

RSpec.describe Auth::MagicLinks::Request do
  before { ActionMailer::Base.deliveries.clear }

  def disable_flag!
    create(:feature_flag, key: "passwordless_auth",
                          description: FeatureFlagRegistry.description_for(:passwordless_auth), enabled: false)
  end

  it "emails a magic link when the account exists" do
    user = create(:user)

    expect { described_class.call(email: user.email) }.to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(ActionMailer::Base.deliveries.last.body.encoded).to include("/auth/magic?token=")
  end

  it "returns an identical accepted payload for missing accounts (F-24)" do
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
