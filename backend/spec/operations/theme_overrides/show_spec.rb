require "rails_helper"

RSpec.describe ThemeOverrides::Show do
  it "returns only overridden tokens per theme" do
    create(:theme_override, theme: "light", token_name: "--text-primary", value: "#0F172A")
    create(:theme_override, theme: "dark", token_name: "--text-primary", value: "#F1F5F9")
    result = described_class.call(account: create(:account))

    expect(result.value.light).to eq("--text-primary" => "#0F172A")
    expect(result.value.dark).to eq({})
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil).error_code).to eq(:forbidden)
  end
end
