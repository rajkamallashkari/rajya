require "rails_helper"

RSpec.describe Admin::Settings do
  let(:admin) { create(:user, :admin) }
  let(:member) { create(:user) }

  describe Admin::Settings::Index do
    it "lists registry settings with current values" do
      result = described_class.call(admin: admin)
      row = result.value.settings.find { |entry| entry.fetch("key") == "message_edit_window" }

      expect(result).to be_success
      expect(row.fetch("value")).to eq(900)
      expect(row.fetch("category")).to eq("messaging")
      expect(row.fetch("overridden")).to be(false)
    end

    it "reports unregistered rows" do
      AppSetting.create!(key: "typo_key", value: 1, category: "general")

      expect(described_class.call(admin: admin).value.unregistered_keys).to eq([ "typo_key" ])
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member).error_code).to eq(:forbidden)
    end
  end

  describe Admin::Settings::Update do
    it "writes an override that Settings.fetch reads without a restart" do
      result = described_class.call(admin: admin, key: "message_edit_window", value: 120)

      expect(result).to be_success
      expect(Settings.fetch(:message_edit_window)).to eq(120)
      expect(result.value.setting.fetch("overridden")).to be(true)
    end

    it "rejects an unregistered key" do
      result = described_class.call(admin: admin, key: "not_a_real_setting", value: 1)

      expect(result.error_code).to eq(:validation_failed)
      expect(AppSetting.find_by(key: "not_a_real_setting")).to be_nil
    end

    it "rejects a value below the registered minimum" do
      result = described_class.call(admin: admin, key: "message_edit_window", value: 0)

      expect(result.error_code).to eq(:validation_failed)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member, key: "message_edit_window", value: 120).error_code).to eq(:forbidden)
    end
  end

  describe Admin::Settings::Destroy do
    it "clears the override and restores the code default" do
      AppSetting.create!(key: "message_edit_window", value: 120, category: "messaging")

      result = described_class.call(admin: admin, key: "message_edit_window")

      expect(result).to be_success
      expect(Settings.fetch(:message_edit_window)).to eq(900)
      expect(result.value.setting.fetch("overridden")).to be(false)
    end

    it "tolerates a registered setting without an override" do
      result = described_class.call(admin: admin, key: "message_edit_window")

      expect(result).to be_success
      expect(result.value.setting.fetch("value")).to eq(900)
    end

    it "rejects an unregistered key" do
      expect(described_class.call(admin: admin, key: "nope").error_code).to eq(:validation_failed)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member, key: "message_edit_window").error_code).to eq(:forbidden)
    end
  end
end
