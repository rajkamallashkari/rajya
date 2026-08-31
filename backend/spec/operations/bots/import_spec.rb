require "rails_helper"

RSpec.describe Bots::Import do
  it "upserts the authored personas as system bots (BR-82)" do # rubocop:disable RSpec/MultipleExpectations -- count plus prompt floor
    result = described_class.call.value

    expect(Bots::Personas::ENTRIES.size).to eq(30)
    expect(result.created).to eq(30)
    expect(Bot.system.count).to eq(30)
    expect(Bot.active.count).to eq(30)
    expect(Bots::Personas::ENTRIES).to all(
      satisfy { |entry| entry.fetch(:persona_prompt).length >= Ai::Limits.prompt_minimum_length }
    )
  end

  it "updates an existing system bot on a second import" do
    described_class.call
    result = described_class.call.value

    expect(result.created).to eq(0)
    expect(result.updated).to eq(30)
  end

  it "records row errors for invalid entries" do
    human = create(:user)
    result = described_class.call(
      [
        { username: "", name: "X", bio: "b", persona_prompt: "A" * 80 },
        { username: "bad name", name: "X", bio: "b", persona_prompt: "A" * 80 },
        { username: "shorty", name: "X", bio: "b", persona_prompt: "tiny" },
        { username: human.account.username, name: "X", bio: "b", persona_prompt: "A" * 80 }
      ]
    ).value

    expect(result.errors.size).to eq(4)
    expect(result.created).to eq(0)
  end

  it "attaches a bot row when a bot-kind account already exists" do
    account = create(:account, :bot_kind, username: "orphanbot")
    result = described_class.call(
      [ { username: "orphanbot", name: "", bio: "b", persona_prompt: "A" * 80 } ]
    ).value

    expect(result.updated).to eq(1)
    expect(account.reload.bot).to be_present
  end

  it "captures persistence errors" do
    allow(Account).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(Account.new))
    result = described_class.call(
      [ { username: "validbot", name: "X", bio: "b", persona_prompt: "A" * 80 } ]
    ).value

    expect(result.errors).not_to be_empty
  end
end
