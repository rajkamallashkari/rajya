require "rails_helper"

RSpec.describe Admin::TranslationStrings do
  let(:admin) { create(:user, :admin) }
  let(:member) { create(:user) }

  describe Admin::TranslationStrings::Index do
    it "lists defaults grouped by surface" do
      result = described_class.call(admin: admin, locale: "en")
      row = result.value.translation_strings.find { |entry| entry.fetch("key") == "errors.not_found" }

      expect(row.fetch("surface")).to eq("errors")
      expect(row.fetch("default")).to eq("The requested resource could not be found.")
      expect(row.fetch("overridden")).to be(false)
    end

    it "filters by query and surface" do
      matches = described_class.call(admin: admin, locale: "en", query: "not_found").value.translation_strings
      surface = described_class.call(admin: admin, locale: "en", surface: "errors").value.translation_strings

      expect(matches.map { |entry| entry.fetch("key") }).to include("errors.not_found")
      expect(surface).not_to be_empty
      expect(surface.map { |entry| entry.fetch("surface") }.uniq).to eq([ "errors" ])
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member).error_code).to eq(:forbidden)
    end
  end

  describe Admin::TranslationStrings::Update do
    it "overrides a string so Catalog.t serves the new value without a restart" do
      result = described_class.call(admin: admin, key: "errors.not_found", value: "Gone.")

      expect(result).to be_success
      expect(Catalog.t("errors.not_found")).to eq("Gone.")
      expect(result.value.translation_string.fetch("overridden")).to be(true)
    end

    it "rejects a blank value" do
      expect(described_class.call(admin: admin, key: "errors.not_found", value: "").error_code).to eq(:validation_failed)
    end

    it "rejects a blank key" do
      expect(described_class.call(admin: admin, key: "", value: "Missing.").error_code).to eq(:validation_failed)
    end

    it "returns validation details when the override cannot be saved" do
      row = build(:translation_string)
      row.errors.add(:value, :invalid)
      allow(TranslationString).to receive(:find_or_initialize_by).and_return(row)
      allow(row).to receive(:save).and_return(false)

      result = described_class.call(admin: admin, key: "errors.not_found", value: "Missing.")

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details).to eq(row.errors.to_hash)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member, key: "errors.not_found", value: "X").error_code).to eq(:forbidden)
    end
  end

  describe Admin::TranslationStrings::Destroy do
    it "resets to the locale default" do
      Admin::TranslationStrings::Update.call(admin: admin, key: "errors.not_found", value: "Gone.")

      result = described_class.call(admin: admin, key: "errors.not_found", locale: "en")

      expect(Catalog.t("errors.not_found")).to eq("The requested resource could not be found.")
      expect(result.value.translation_string.fetch("overridden")).to be(false)
    end

    it "removes database-only strings and tolerates a missing row" do
      TranslationString.create!(key: "custom.only", locale: "en", value: "Custom", updated_by_user: admin)

      removed = described_class.call(admin: admin, key: "custom.only")
      missing = described_class.call(admin: admin, key: "custom.missing")

      expect(removed).to be_success
      expect(missing).to be_success
      expect(TranslationString.where(key: [ "custom.only", "custom.missing" ])).to be_empty
    end

    it "returns a registered default when no override exists" do
      result = described_class.call(admin: admin, key: "errors.not_found")

      expect(result).to be_success
      expect(result.value.translation_string.fetch("value")).to eq("The requested resource could not be found.")
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member, key: "errors.not_found").error_code).to eq(:forbidden)
    end
  end
end
