require "rails_helper"

# rubocop:disable RSpec/ExampleLength
RSpec.describe Bots::RetrieveMemories do
  def unit_vector(index)
    values = Array.new(8, 0.0)
    values[index] = 1.0
    values + Array.new(760, 0.0)
  end

  def store(bot, content, vector, account:)
    create(
      :bot_memory, bot: bot, content: content, source_account: account,
      embedding: Bots::Vector.literal(vector)
    )
  end

  it "returns a fact stored from another account (NR-11)" do
    bot = create(:bot)
    alice = create(:user).account
    bob = create(:user).account
    store(bot, "The project codename is Orchid", unit_vector(0), account: alice)
    store(bot, "Prefers window seats", unit_vector(7), account: bob)
    query = unit_vector(0)
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: [ query ], status: "success", provider: "ollama", model: "nomic")
    )

    rows = described_class.call(bot: bot, query: "what is the codename?", account: bob).value

    expect(rows.first.content).to eq("The project codename is Orchid")
    expect(rows.first.source_account_id).to eq(alice.id)
    expect(rows.first.reload.last_recalled_at).to be_present
    expect(rows.map(&:content)).to include("Prefers window seats")
  end

  it "does not filter on source_account_id and skips when memory is disabled" do
    bot = create(:bot, memory_enabled: false)
    allow(Ai::Runner).to receive(:embed)

    expect(described_class.call(bot: bot, query: "hi", account: create(:account)).value).to eq([])
    expect(Ai::Runner).not_to have_received(:embed)
    expect(described_class.call(bot: nil, query: "hi", account: create(:account)).value).to eq([])
  end

  it "returns empty when embed fails" do
    bot = create(:bot)
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "timeout", provider: "ollama", model: "nomic")
    )

    expect(described_class.call(bot: bot, query: "hi", account: create(:account)).value).to eq([])
  end

  it "returns empty on a blank query or an embed exception" do
    bot = create(:bot)
    expect(described_class.call(bot: bot, query: "  ", account: create(:account)).value).to eq([])
    allow(Ai::Runner).to receive(:embed).and_raise(ArgumentError)
    expect(described_class.call(bot: bot, query: "hi", account: create(:account)).value).to eq([])
  end

  it "returns empty when there are no stored memories" do
    bot = create(:bot)
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: [ unit_vector(0) ], status: "success", provider: "ollama", model: "nomic")
    )
    expect(described_class.call(bot: bot, query: "hi", account: create(:account)).value).to eq([])
  end

  it "returns empty when embed succeeds without vectors" do
    bot = create(:bot)
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: nil, status: "success", provider: "ollama", model: "nomic")
    )
    expect(described_class.call(bot: bot, query: "hi", account: create(:account)).value).to eq([])
  end
end
# rubocop:enable RSpec/ExampleLength
