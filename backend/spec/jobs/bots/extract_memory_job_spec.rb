require "rails_helper"

RSpec.describe Bots::ExtractMemoryJob do
  it "delegates to ExtractMemory" do
    bot = create(:bot)
    message = create(:message)
    allow(Bots::ExtractMemory).to receive(:call).and_return(Result.success(0))

    described_class.perform_now(bot.id, message.id)

    expect(Bots::ExtractMemory).to have_received(:call).with(bot: bot, message: message)
  end

  it "no-ops when records are missing" do
    allow(Bots::ExtractMemory).to receive(:call)
    described_class.perform_now(0, 0)
    expect(Bots::ExtractMemory).not_to have_received(:call)
  end
end
