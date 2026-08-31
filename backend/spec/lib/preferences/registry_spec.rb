require "rails_helper"

RSpec.describe Preferences::Registry do
  it "registers every SCHEMA §7 namespace" do
    expect(described_class.tree.keys).to contain_exactly(
      "appearance", "locale", "privacy", "chat", "ai", "notifications"
    )
  end

  it "lists leaf paths including nested wallpaper and scoped notification keys" do
    expect(described_class.paths).to include(
      "appearance.theme", "appearance.wallpaper.preset", "appearance.text_size",
      "locale.timezone", "locale.date_format", "privacy.read_receipts",
      "chat.quick_reactions", "ai.style_profile_enabled", "notifications.level",
      "notifications.dnd_days"
    )
    expect(described_class.paths.count { |path| path.start_with?("locale.date_format") }).to eq(1)
    expect(Preferences::Schema::DATE_FORMATS.size).to eq(11)
    expect(described_class.tree.fetch("notifications").fetch(:fields).keys)
      .to match_array(Notifications::Cascade::KEYS)
  end

  it "keeps notification field defaults aligned with the cascade settings row (BR-98)" do
    expect(described_class.payload.fetch("defaults").fetch("notifications").fetch("global"))
      .to eq(Settings.fetch(:notification_cascade_defaults))
  end

  it "exports a payload whose field keys match the path list" do
    payload = described_class.payload

    expect(payload.fetch("fields").keys).to match_array(described_class.paths)
    expect(payload.fetch("defaults").dig("appearance", "theme")).to eq("system")
  end

  it "generates TypeScript that names every preference path" do
    dts = described_class.typescript

    described_class.paths.each { |path| expect(dts).to include(path.to_json) }
    expect(dts).to include("export interface PreferenceDocument")
  end

  it "matches the committed frontend artefact so generated types cannot drift" do
    json = JSON.parse(Rails.root.join("../frontend/src/shared/lib/config/preferences-registry.json").read)
    dts = Rails.root.join("../frontend/src/shared/lib/config/preferences-registry.d.ts").read

    expect(json.fetch("fields").keys).to match_array(described_class.paths)
    described_class.paths.each { |path| expect(dts).to include(path.to_json) }
  end

  it "restores a replaced field after a temporary registry override" do
    expect(Preferences.defaults.dig("chat", "enter_to_send")).to be(true)
    described_class.with_temporary_field("chat", "enter_to_send", type: :boolean, default: false) do
      expect(Preferences.defaults.dig("chat", "enter_to_send")).to be(false)
    end
    expect(Preferences.defaults.dig("chat", "enter_to_send")).to be(true)
  end
end
