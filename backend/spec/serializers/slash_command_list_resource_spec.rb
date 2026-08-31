require "rails_helper"

RSpec.describe SlashCommandListResource do
  it "wraps builtin and bot command entries" do
    entry = SlashCommands::Entry.new(
      name: "plan", description: "Turn a goal into steps", usage_hint: "/plan <goal>",
      source: "bot", bot_account_id: 9, client_action: nil
    )
    json = described_class.new(SlashCommands::List.new(commands: [ entry ])).to_h

    expect(json.fetch("commands").sole).to include(
      "name" => "plan", "source" => "bot", "bot_account_id" => 9, "client_action" => nil
    )
  end
end
