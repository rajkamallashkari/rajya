require "rails_helper"

RSpec.describe Bots::Regenerate do
  def setup
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    trigger = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    reply = Bots::PersistReply.call(
      conversation: conversation, bot: bot, body: "Old", triggered_by: trigger,
      generation_id: "g", nonce: SecureRandom.uuid
    ).value
    [ user, bot, conversation, trigger, reply ]
  end

  it "tombstones the old reply and enqueues a new generation (BR-15)" do
    user, bot, conversation, trigger, reply = setup

    result = described_class.call(message: reply, actor: user.account)

    expect(result).to be_success
    expect(reply.reload).to be_deleted
    expect(reply.body).to be_nil
    expect(Bots::ReplyJob).to have_been_enqueued.with(conversation.id, trigger.id, bot.id, reply.id)
  end

  it "refuses a non-prompting account and a human message" do
    user, _bot, conversation, _trigger, reply = setup
    stranger = create(:user)
    create(:conversation_membership, conversation: conversation, account: stranger.account)
    human = Messages::Send.call(conversation: conversation, sender: user.account, body: "later").value

    expect(described_class.call(message: reply, actor: stranger.account).error_code).to eq(:forbidden)
    expect(described_class.call(message: human, actor: user.account).error_code).to eq(:forbidden)
  end

  it "rejects a second regenerate on an already tombstoned reply" do
    user, _bot, _conversation, _trigger, reply = setup
    described_class.call(message: reply, actor: user.account)

    expect(described_class.call(message: reply.reload, actor: user.account).error_code).to eq(:forbidden)
  end

  it "returns not_found when the prompting message no longer exists" do
    user, _bot, _conversation, trigger, reply = setup
    trigger.destroy!
    reply.update!(metadata: reply.metadata.merge("triggered_by_message_id" => 0))

    expect(described_class.call(message: reply, actor: user.account).error_code).to eq(:not_found)
  end
end
