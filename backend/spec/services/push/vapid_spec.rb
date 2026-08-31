require "rails_helper"

RSpec.describe Push::Vapid do
  it "is configured only when both keys are present" do
    ENV.delete("VAPID_PUBLIC_KEY")
    ENV.delete("VAPID_PRIVATE_KEY")
    expect(described_class).not_to be_configured

    with_vapid_env do
      expect(described_class).to be_configured
      expect(described_class.subject).to eq("mailto:test@rajya.local")
      expect(described_class.details).to include(public_key: described_class.public_key)
    end
  end

  it "falls back to the default subject" do
    ENV.delete("VAPID_SUBJECT")
    expect(described_class.subject).to eq("mailto:noreply@rajya.local")
  end
end
