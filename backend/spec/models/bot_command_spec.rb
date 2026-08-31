require "rails_helper"

RSpec.describe BotCommand do
  it "is valid with a schema-shaped name" do
    expect(build(:bot_command, name: "plan_v2")).to be_valid
  end

  it "rejects a blank description, a reserved builtin name, and a malformed name" do
    expect(build(:bot_command, name: "")).not_to be_valid
    expect(build(:bot_command, description: "")).not_to be_valid
    expect(build(:bot_command, name: "help")).not_to be_valid
    expect(build(:bot_command, name: "bad-name")).not_to be_valid
  end

  it "rejects a negative position and a mixed-case name" do
    expect(build(:bot_command, position: -1)).not_to be_valid
    expect(build(:bot_command, name: "Sticker")).not_to be_valid
  end

  it "enforces uniqueness per bot" do
    bot = create(:bot)
    create(:bot_command, bot: bot, name: "plan")

    expect(build(:bot_command, bot: bot, name: "PLAN")).not_to be_valid
  end
end
