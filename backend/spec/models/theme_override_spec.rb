require "rails_helper"

RSpec.describe ThemeOverride do
  it "accepts a design-system default that already passes contrast" do
    expect(build(:theme_override)).to be_valid
  end

  it "rejects an override that would drop text below WCAG AA" do
    override = build(:theme_override, token_name: "--text-primary", value: "#EFF6FF")

    expect(override).not_to be_valid
    expect(override.errors[:value].join).to include("--text-primary vs --surface-app")
  end

  it "rejects an accent that cannot produce readable contrast text" do
    override = build(:theme_override, token_name: "--accent", value: "#777777")

    expect(override).not_to be_valid
    expect(override.errors[:value].join).to include("--accent")
  end

  it "accepts a readable accent" do
    expect(build(:theme_override, token_name: "--accent", value: "#4F46E5")).to be_valid
  end

  it "describes the contrast pair for accent and text tokens" do
    accent = build(:theme_override, token_name: "--accent")
    text = build(:theme_override, token_name: "--text-primary")

    expect(accent.contrast_pair.fetch("against")).to include(Theme::Contrast::WHITE)
    expect(text.contrast_pair).to eq("token" => "--text-primary", "against" => "--surface-app")
  end

  it "skips contrast pairing for tokens that are not body text" do
    expect(build(:theme_override, token_name: "--status-success", value: "#16A34A")).to be_valid
  end

  it "skips contrast when required fields are blank" do
    blank_value = described_class.new(theme: "light", token_name: "--text-primary", value: nil)
    blank_token = described_class.new(theme: "light", token_name: nil, value: "#1E293B")
    blank_theme = described_class.new(theme: nil, token_name: "--text-primary", value: "#1E293B")

    expect(blank_value.tap(&:valid?).errors[:value]).not_to include(Catalog.t("errors.models.theme_override.contrast"))
    expect(blank_token.tap(&:valid?).errors[:value]).not_to include(Catalog.t("errors.models.theme_override.contrast"))
    expect(blank_theme.tap(&:valid?).errors[:value]).not_to include(Catalog.t("errors.models.theme_override.contrast"))
  end

  it "rejects a token that is not in the semantic layer" do
    override = build(:theme_override, token_name: "--gray-500", value: "#64748B")

    expect(override).not_to be_valid
    expect(override.errors[:token_name]).to be_present
  end
end
