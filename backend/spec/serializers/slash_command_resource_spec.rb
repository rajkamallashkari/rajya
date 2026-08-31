require "rails_helper"

RSpec.describe SlashCommandResource do
  it "serializes a command entry" do
    entry = SlashCommands::Builtins.entry_for(SlashCommands::Builtins::HELP)
    json = described_class.new(entry).to_h

    expect(json).to include("name" => "help", "source" => "builtin", "client_action" => nil)
  end
end
