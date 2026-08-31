require "rails_helper"

RSpec.describe PreferenceDocuments do
  describe PreferenceDocuments::Show do
    it "materializes registry defaults when the row is empty" do
      account = create(:user).account
      view = described_class.call(account: account).value

      expect(view.data.dig("appearance", "theme")).to eq("system")
      expect(view.data.dig("locale", "timezone")).to eq("UTC")
      expect(view.data.dig("ai", "style_profile_enabled")).to be(false)
    end

    it "creates a preferences row when the account has none" do
      account = create(:account)

      expect { described_class.call(account: account) }.to change(Preference, :count).by(1)
    end
  end

  describe PreferenceDocuments::Update do
    it "deep-merges a valid patch" do
      account = create(:user).account
      result = described_class.call(
        account: account,
        patch: { "appearance" => { "theme" => "light" }, "privacy" => { "last_active" => false } }
      )

      expect(result).to be_success
      expect(result.value.data.dig("appearance", "theme")).to eq("light")
      expect(result.value.data.dig("privacy", "last_active")).to be(false)
    end

    it "keeps registry defaults for keys the patch omitted" do
      account = create(:user).account
      result = described_class.call(account: account, patch: { "appearance" => { "theme" => "light" } })

      expect(result.value.data.dig("appearance", "density")).to eq("comfortable")
      expect(account.preference.reload.data.dig("appearance", "theme")).to eq("light")
    end

    it "rejects an unknown key" do
      result = described_class.call(account: create(:user).account, patch: { "appearance" => { "neon" => true } })

      expect(result).to be_failure
      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details.keys).to include("appearance.neon")
    end

    it "rejects a font id that is not in the catalogue" do
      result = described_class.call(
        account: create(:user).account,
        patch: { "appearance" => { "font_config_id" => 9_999_999 } }
      )

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details.keys).to include("appearance.font_config_id")
    end

    it "accepts a font that exists" do
      font = create(:font_config)
      result = described_class.call(
        account: create(:user).account,
        patch: { "appearance" => { "font_config_id" => font.id } }
      )

      expect(result).to be_success
      expect(result.value.data.dig("appearance", "font_config_id")).to eq(font.id)
    end

    it "accepts a matching chat font from the catalogue" do
      font = create(:font_config)
      result = described_class.call(
        account: create(:user).account,
        patch: { "appearance" => { "chat_font_config_id" => font.id } }
      )

      expect(result).to be_success
      expect(result.value.data.dig("appearance", "chat_font_config_id")).to eq(font.id)
    end
  end
end
