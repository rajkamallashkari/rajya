require "rails_helper"

RSpec.describe BotMemory do
  it "loads a row whose embedding column is the pgvector type" do
    memory = create(:bot_memory)

    expect(memory.reload.embedding).to be_nil
    expect(memory.content).to be_present
  end
end
