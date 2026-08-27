require "rails_helper"

RSpec.describe Settings do
  describe ".fetch" do
    it "returns the code-defined default when no row exists" do
      expect(described_class.fetch(:message_edit_window)).to eq(900)
    end

    it "returns the DB override without a restart" do
      AppSetting.create!(key: "message_edit_window", value: 120, category: "messaging")

      expect(described_class.fetch(:message_edit_window)).to eq(120)
    end

    it "invalidates the cache when the row is updated" do
      setting = AppSetting.create!(key: "message_edit_window", value: 120, category: "messaging")
      expect(described_class.fetch(:message_edit_window)).to eq(120)

      setting.update!(value: 60)

      expect(described_class.fetch(:message_edit_window)).to eq(60)
    end

    it "returns nil for an allow_nil setting when no row exists" do
      expect(described_class.fetch(:max_members)).to be_nil
    end

    it "raises UnregisteredKey for a key that is not in the registry" do
      expect { described_class.fetch(:not_a_real_setting) }.to raise_error(Settings::UnregisteredKey, "not_a_real_setting")
    end
  end

  describe ".unregistered_keys" do
    it "reports app_settings rows whose key is not in the registry" do
      AppSetting.create!(key: "typo_key", value: 1, category: "general")

      expect(described_class.unregistered_keys).to eq([ "typo_key" ])
    end
  end

  describe ".registry_payload" do
    it "exposes type, category, default and description for every registered key" do
      payload = described_class.registry_payload.fetch("message_edit_window")

      expect(payload.fetch("type")).to eq("integer")
      expect(payload.fetch("category")).to eq("messaging")
      expect(payload.fetch("default")).to eq(900)
      expect(payload.fetch("description")).to include("BR-2")
    end

    it "includes every registry key so the generated TS types cannot drop a constant" do
      expect(described_class.registry_payload.keys).to match_array(Settings::Registry.keys.map(&:to_s))
    end
  end

  describe ".coerce" do
    it "coerces integers, floats and booleans" do
      expect(described_class.send(:coerce, "3", { type: :integer })).to eq(3)
      expect(described_class.send(:coerce, "1.5", { type: :float })).to eq(1.5)
      expect(described_class.send(:coerce, "true", { type: :boolean })).to be(true)
    end

    it "coerces strings, arrays and objects" do
      expect(described_class.send(:coerce, :sendgrid, { type: :string })).to eq("sendgrid")
      expect(described_class.send(:coerce, "a", { type: :array })).to eq([ "a" ])
      expect(described_class.send(:coerce, { "k" => 1 }, { type: :object })).to eq({ "k" => 1 })
    end

    it "returns the value unchanged for an unknown type or a non-hash object" do
      expect(described_class.send(:coerce, "x", { type: :other })).to eq("x")
      expect(described_class.send(:coerce, "x", { type: :object })).to eq("x")
    end

    it "returns nil when allow_nil is set and the value is nil" do
      expect(described_class.send(:coerce, nil, { type: :integer, allow_nil: true })).to be_nil
    end
  end
end
