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
    expect(policy).not_to be_show
  end
end
