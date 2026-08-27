require "rails_helper"

RSpec.describe Theme::Overrides do
  it "returns design-system defaults when no rows exist" do
    expect(described_class.fetch(:light).fetch("--text-primary")).to eq("#1E293B")
  end

  it "merges DB overrides and invalidates on write" do
    row = ThemeOverride.create!(theme: "light", token_name: "--text-primary", value: "#0F172A")
    expect(described_class.fetch(:light).fetch("--text-primary")).to eq("#0F172A")

    row.update!(value: "#020617")

    expect(described_class.fetch(:light).fetch("--text-primary")).to eq("#020617")
  end
end
