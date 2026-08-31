require "rails_helper"

RSpec.describe MessagePolicy do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, message ]
  end

  it "allows the sender to edit, unsend, react, save, pin, and forward" do
    user, message = setup
    policy = described_class.new(user.account, message)

    expect(policy).to be_show.and be_update.and be_destroy
    expect(policy).to be_forward.and be_react.and be_save.and be_pin
  end

  # rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- prompting vs peer vs human vs nil actor
  it "allows the prompting account to regenerate a bot reply and refuses others (BR-15)" do
    user = create(:user)
    peer = create(:user)
    bot = create(:bot)
    conversation = create_talk(kind: "group", owner: user.account, members: [ peer.account, bot.account ])
    trigger = Messages::Send.call(
      conversation: conversation, sender: user.account, body: "Hi <@#{bot.account_id}>"
    ).value
    reply = Bots::PersistReply.call(
      conversation: conversation, bot: bot, body: "Old", triggered_by: trigger,
      generation_id: "g", nonce: SecureRandom.uuid
    ).value

    expect(described_class.new(user.account, reply)).to be_regenerate
    expect(described_class.new(peer.account, reply)).not_to be_regenerate
    expect(described_class.new(user.account, trigger)).not_to be_regenerate
    expect(described_class.new(nil, reply)).not_to be_regenerate
    expect(described_class.new(user.account, Message)).not_to be_regenerate
    outsider = create(:user)
    expect(described_class.new(outsider.account, reply)).not_to be_regenerate
    reply.update_columns(sender_account_id: nil)
    expect(described_class.new(user.account, reply.reload)).not_to be_regenerate
    reply.update_columns(sender_account_id: bot.account_id)
    reply.update!(deleted_at: Time.current)
    expect(described_class.new(user.account, reply)).not_to be_regenerate
  end
  # rubocop:enable RSpec/ExampleLength

  it "denies another member edit/unsend but allows react" do
    user, message = setup
    peer = message.conversation.conversation_memberships.where.not(account: user.account).sole.account
    policy = described_class.new(peer, message)

    expect(policy).not_to be_update
    expect(policy).not_to be_destroy
    expect(policy).to be_show.and be_react
  end

  it "scopes to conversations the account is an active member of" do
    user, message = setup
    create(:message)
    expect(described_class::Scope.new(user.account, Message.all).resolve).to contain_exactly(message)
    expect(described_class::Scope.new(nil, Message.all).resolve).to be_empty
  end

  it "denies update on a class record and with no acting account" do
    user, message = setup
    policy = described_class.new(nil, message)
    expect(described_class.new(user.account, Message)).not_to be_show
    expect(policy).not_to be_update
    expect(described_class.new(user.account, Message)).to be_bulk_unsend.and be_bulk_forward.and be_bulk_save
    expect(described_class.new(nil, Message)).not_to be_bulk_unsend
  end

  it "denies forward when the conversation restricts forwarding (NR-37)" do
    user, message = setup
    message.conversation.update!(restrict_forwarding: true)

    expect(described_class.new(user.account, message)).not_to be_forward
  end
end
