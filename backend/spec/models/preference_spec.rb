require "rails_helper"

RSpec.describe Preference do
  describe "#privacy" do
    it "returns a stored privacy flag" do
      preference = build(:preference, data: { "privacy" => { "last_active" => false } })

      expect(preference.privacy("last_active")).to be(false)
    end

    it "falls back to SCHEMA §7 defaults when the key is absent" do
      preference = build(:preference, data: {})

      expect(preference.privacy("discoverable_by_username")).to be(true)
      expect(preference.privacy("discoverable_by_email")).to be(false)
    end

    it "falls back to defaults when data is not a hash" do
      preference = build(:preference)
      allow(preference).to receive(:data).and_return("x")

      expect(preference.privacy("last_active")).to be(true)
    end
  end

  describe "#timezone" do
    it "reads locale.timezone and falls back to UTC" do
      stored = build(:preference, data: { "locale" => { "timezone" => "Asia/Kolkata" } })
      expect(stored.timezone).to eq("Asia/Kolkata")
      expect(build(:preference, data: {}).timezone).to eq("UTC")
      broken = build(:preference)
      allow(broken).to receive(:data).and_return("x")
      expect(broken.timezone).to eq("UTC")
    end
  end
end
