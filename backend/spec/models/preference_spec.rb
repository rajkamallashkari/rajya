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

  describe "style profile consent" do
    it "defaults to disabled so history does not leave without opt-in (F-11)" do
      preference = build(:preference, data: {})
      expect(preference.style_profile_enabled?).to be(false)
      expect(preference.style_profile).to be_nil
    end

    it "reads an enabled flag and merges the blob" do
      preference = create(:preference, data: {})
      preference.merge_ai!("style_profile_enabled" => true, "style_profile" => { "global" => "casual" })
      expect(preference.reload.style_profile_enabled?).to be(true)
      expect(preference.style_profile["global"]).to eq("casual")
      expect(preference.style_profile_updated_at).to be_nil
    end

    it "falls back when data is not a hash" do
      preference = build(:preference)
      allow(preference).to receive(:data).and_return("x")
      expect(preference.style_profile_enabled?).to be(false)
      expect(preference.style_profile).to be_nil
      expect(preference.style_profile_updated_at).to be_nil
    end

    it "starts an ai object when merging into non-hash data" do
      preference = create(:preference, data: {})
      preference.update_columns(data: "x")
      preference.merge_ai!("style_profile_enabled" => true)
      expect(preference.reload.style_profile_enabled?).to be(true)
    end
  end
end
