require "rails_helper"

RSpec.describe Admin::ThemeOverrides do
  let(:admin) { create(:user, :admin) }
  let(:member) { create(:user) }

  describe Admin::ThemeOverrides::Index do
    it "lists semantic tokens with defaults" do
      result = described_class.call(admin: admin)
      token = result.value.themes.fetch("light").find { |entry| entry.fetch("token_name") == "--text-primary" }

      expect(token.fetch("default")).to eq("#1E293B")
      expect(token.fetch("overridden")).to be(false)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member).error_code).to eq(:forbidden)
    end
  end

  describe Admin::ThemeOverrides::Upsert do
    it "stores a contrast-safe override (NR-48)" do
      result = described_class.call(admin: admin, theme: "light", token_name: "--text-primary", value: "#0F172A")

      expect(result).to be_success
      expect(Theme::Overrides.fetch("light").fetch("--text-primary")).to eq("#0F172A")
    end

    it "rejects a low-contrast override and names the failing pair" do
      result = described_class.call(admin: admin, theme: "light", token_name: "--text-primary", value: "#EFF6FF")

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details.fetch("pair")).to eq("token" => "--text-primary", "against" => "--surface-app")
      expect(result.error_details.fetch("value").join).to include("--text-primary")
      expect(result.error_details.fetch("value").join).to include("--surface-app")
    end

    it "returns validation details without a contrast pair for other invalid attributes" do
      row = build(:theme_override)
      row.errors.add(:theme, :inclusion)
      allow(ThemeOverride).to receive(:find_or_initialize_by).and_return(row)
      allow(row).to receive(:save).and_return(false)

      result = described_class.call(admin: admin, theme: "light", token_name: "--text-primary", value: "#0F172A")

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details).to have_key("theme")
      expect(result.error_details).not_to have_key("pair")
    end

    it "rejects a primitive token" do
      result = described_class.call(admin: admin, theme: "light", token_name: "--gray-500", value: "#64748B")

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details.fetch("pair").fetch("token")).to eq("--gray-500")
    end

    it "rejects a non-admin" do
      expect(
        described_class.call(admin: member, theme: "light", token_name: "--accent", value: "#4F46E5").error_code
      ).to eq(:forbidden)
    end
  end

  describe Admin::ThemeOverrides::Reset do
    it "restores a single token" do
      create(:theme_override, theme: "light", token_name: "--text-primary", value: "#0F172A")

      described_class.call(admin: admin, theme: "light", token_name: "--text-primary")

      expect(Theme::Overrides.fetch("light").fetch("--text-primary")).to eq("#1E293B")
    end

    it "restores every override globally" do
      create(:theme_override, theme: "light", token_name: "--text-primary", value: "#0F172A")
      create(:theme_override, theme: "dark", token_name: "--text-primary", value: "#FFFFFF")

      described_class.call(admin: admin)

      expect(ThemeOverride.count).to eq(0)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member).error_code).to eq(:forbidden)
    end
  end
end
