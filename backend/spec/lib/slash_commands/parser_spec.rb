require "rails_helper"

RSpec.describe SlashCommands::Parser do
  it "parses a command name and arguments from an ordinary message body" do
    parsed = described_class.parse("  /Plan  ship friday  ")

    expect(parsed.name).to eq("plan")
    expect(parsed.arguments).to eq("ship friday")
  end

  it "parses a bare command and ignores a non-command body" do
    expect(described_class.parse("/help").arguments).to eq("")
    expect(described_class.parse("hello /help")).to be_nil
    expect(described_class.parse("")).to be_nil
  end
end
