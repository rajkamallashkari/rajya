require "rails_helper"

RSpec.describe AppSetting do
  it "accepts a registered value inside the declared range" do
    expect(build(:app_setting, key: "message_edit_window", value: 120, category: "messaging")).to be_valid
  end

  it "rejects a registered value below the minimum" do
    setting = build(:app_setting, key: "message_edit_window", value: 0, category: "messaging")

    expect(setting).not_to be_valid
    expect(setting.errors[:value]).to include(Catalog.t("errors.models.app_setting.below_min"))
  end

  it "rejects a registered value above the maximum" do
    setting = build(:app_setting, key: "message_edit_window", value: 100_000, category: "messaging")

    expect(setting).not_to be_valid
    expect(setting.errors[:value]).to include(Catalog.t("errors.models.app_setting.above_max"))
  end

  it "rejects a registered value of the wrong type" do
    setting = build(:app_setting, key: "message_edit_window", value: { "n" => 1 }, category: "messaging")

    expect(setting).not_to be_valid
    expect(setting.errors[:value]).to include(Catalog.t("errors.models.app_setting.wrong_type"))
  end

  it "allows an unregistered key so a typo cannot crash a write" do
    expect(build(:app_setting, key: "typo_key", value: { "n" => 1 }, category: "general")).to be_valid
  end

  it "allows a nil in-memory value for an allow_nil registered setting" do
    expect(build(:app_setting, key: "max_members", value: nil, category: "groups")).to be_valid
  end

  it "accepts a registered string with no numeric range" do
    expect(build(:app_setting, key: "email_from_name", value: "Rajya", category: "auth")).to be_valid
  end

  it "rejects a non-numeric string for an integer setting" do
    setting = build(:app_setting, key: "message_edit_window", value: "abc", category: "messaging")

    expect(setting).not_to be_valid
    expect(setting.errors[:value]).to include(Catalog.t("errors.models.app_setting.wrong_type"))
  end
end
