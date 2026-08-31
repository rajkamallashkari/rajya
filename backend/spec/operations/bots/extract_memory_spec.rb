require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations, RSpec/ReceiveMessages
RSpec.describe Bots::ExtractMemory do
  def vector
    Array.new(768, 0.01)
  end

  it "stores facts with provenance and does not filter later retrieval (NR-11)" do
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "I drink oolong tea").value
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "The user drinks oolong tea", status: "success", provider: "groq", model: "llama")
    )
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: [ vector ], status: "success", provider: "ollama", model: "nomic")
    )

    expect(described_class.call(bot: bot, message: message).value).to eq(1)
    memory = bot.bot_memories.sole
    expect(memory.content).to include("oolong")
    expect(memory.source_account_id).to eq(user.account_id)
    expect(memory.source_message_id).to eq(message.id)
    expect(memory.embedding).to be_present
  end

  it "skips blank, bot-authored, disabled memory, and NONE extracts" do
    bot = create(:bot)
    human = create(:user)
    conversation = create_direct_between(human.account, bot.account)
    blank = create(:message, conversation: conversation, sender_account: human.account, body: "")
    expect(described_class.call(bot: bot, message: blank).value).to eq(0)

    bot_message = create(:message, conversation: conversation, sender_account: bot.account, body: "Hi")
    expect(described_class.call(bot: bot, message: bot_message).value).to eq(0)

    bot.update!(memory_enabled: false)
    text = Messages::Send.call(conversation: conversation, sender: human.account, body: "secret").value
    expect(described_class.call(bot: bot, message: text).value).to eq(0)

    bot.update!(memory_enabled: true)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "NONE", status: "success", provider: "groq", model: "llama")
    )
    expect(described_class.call(bot: bot, message: message_for(conversation, human.account)).value).to eq(0)
  end

  it "enqueues extract jobs for bot members on a human send" do
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Fact").value

    expect(Bots::ExtractMemoryJob).to have_been_enqueued.with(bot.id, message.id)
  end

  it "skips enqueue for blank or bot-authored messages and a nil bot" do
    bot = create(:bot)
    human = create(:user)
    conversation = create_direct_between(human.account, bot.account)
    blank = create(:message, conversation: conversation, sender_account: human.account, body: "")
    described_class.enqueue(blank)
    expect(Bots::ExtractMemoryJob).not_to have_been_enqueued.with(bot.id, blank.id)

    bot_message = create(:message, conversation: conversation, sender_account: bot.account, body: "Hi")
    described_class.enqueue(bot_message)
    expect(Bots::ExtractMemoryJob).not_to have_been_enqueued.with(bot.id, bot_message.id)

    expect(described_class.call(bot: nil, message: message_for(conversation, human.account)).value).to eq(0)
  end

  it "skips enqueue and extract when the sender account is missing" do
    bot = create(:bot)
    human = create(:user)
    conversation = create_direct_between(human.account, bot.account)
    message = create(:message, conversation: conversation, sender_account: human.account, body: "Fact")
    allow(message).to receive(:sender_account).and_return(nil)
    described_class.enqueue(message)
    expect(Bots::ExtractMemoryJob).not_to have_been_enqueued.with(bot.id, message.id)
    expect(described_class.call(bot: bot, message: message).value).to eq(0)
  end

  it "skips when extract or embed fails and when vector counts mismatch" do
    human = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(human.account, bot.account)
    message = message_for(conversation, human.account)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "timeout", provider: "groq", model: "llama")
    )
    expect(described_class.call(bot: bot, message: message).value).to eq(0)

    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "- drinks tea\n- likes rain", status: "success", provider: "groq", model: "llama")
    )
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: [ vector ], status: "success", provider: "ollama", model: "nomic")
    )
    expect(described_class.call(bot: bot, message: message).value).to eq(0)

    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "timeout", provider: "ollama", model: "nomic")
    )
    expect(described_class.call(bot: bot, message: message).value).to eq(0)
  end

  it "skips persist when a vector is empty" do
    human = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(human.account, bot.account)
    message = message_for(conversation, human.account)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "drinks tea", status: "success", provider: "groq", model: "llama")
    )
    allow(Ai::Runner).to receive(:embed).and_return(
      Ai::Runner::Result.new(vectors: [ [] ], status: "success", provider: "ollama", model: "nomic")
    )
    expect(described_class.call(bot: bot, message: message).value).to eq(1)
    expect(bot.bot_memories).to be_empty
  end

  def message_for(conversation, account)
    Messages::Send.call(conversation: conversation, sender: account, body: "another fact").value
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations, RSpec/ReceiveMessages
