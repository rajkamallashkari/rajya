require "rails_helper"

RSpec.describe Bots::PersistReply do
  def setup
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    trigger = Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value
    [ user, bot, conversation, trigger ]
  end

  # rubocop:disable RSpec/ExampleLength -- nonce, watermarks, and metadata on one persist
  it "persists the bot message, advances watermarks, and is idempotent on nonce (BR-76, S-9)" do
    user, bot, conversation, trigger = setup
    nonce = SecureRandom.uuid
    first = described_class.call(
      conversation: conversation, bot: bot, body: "Pong", triggered_by: trigger,
      generation_id: "g1", nonce: nonce
    ).value
    second = described_class.call(
      conversation: conversation, bot: bot, body: "Pong", triggered_by: trigger,
      generation_id: "g1", nonce: nonce
    ).value
    membership = conversation.conversation_memberships.find_by!(account: bot.account)

    expect(first.body).to eq("Pong")
    expect(second.id).to eq(first.id)
    expect(first.metadata).to include(
      "triggered_by_message_id" => trigger.id, "prompted_by_account_id" => user.account.id
    )
    expect(membership.last_read_position).to eq(first.position)
  end
  # rubocop:enable RSpec/ExampleLength

  it "rejects a blank body" do
    _user, bot, conversation, trigger = setup
    expect(
      described_class.call(
        conversation: conversation, bot: bot, body: "  ", triggered_by: trigger,
        generation_id: "g", nonce: SecureRandom.uuid
      ).error_code
    ).to eq(:validation_failed)
  end
end
