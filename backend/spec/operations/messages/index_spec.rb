require "rails_helper"

RSpec.describe Messages::Index do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, position: 1)
    [ conversation.messages, message ]
  end

  it "returns a cursor page by default" do
    scope, message = setup
    result = described_class.call(scope: scope)

    expect(result).to be_success
    expect(result.value.messages).to eq([ message ])
    expect(result.value.pivot_id).to be_nil
  end

  it "jumps around a message id" do
    scope, message = setup
    result = described_class.call(scope: scope, around_id: message.id)

    expect(result).to be_success
    expect(result.value.pivot_id).to eq(message.id)
  end

  it "jumps around a timestamp" do
    scope, message = setup
    result = described_class.call(scope: scope, around_at: message.created_at.iso8601)

    expect(result).to be_success
    expect(result.value.messages).to eq([ message ])
  end

  it "fails when around_id is missing from the scope" do
    scope, _message = setup
    result = described_class.call(scope: scope, around_id: 0)

    expect(result).not_to be_success
    expect(result.error_code).to eq(:not_found)
  end

  it "fails when around_at is not ISO-8601" do
    scope, _message = setup
    result = described_class.call(scope: scope, around_at: "nope")

    expect(result.error_code).to eq(:validation_failed)
  end

  it "fails when before and after are both set or a cursor is not an integer" do
    scope, _message = setup

    expect(described_class.call(scope: scope, before: 1, after: 2).error_code).to eq(:validation_failed)
    expect(described_class.call(scope: scope, after: "x").error_code).to eq(:validation_failed)
  end

  it "returns mutations newer than after_revision (BR-33)" do
    scope, message = setup
    result = described_class.call(scope: scope, after_revision: message.revision - 1)

    expect(result).to be_success
    expect(result.value.messages).to eq([ message ])
  end

  it "fails when after_revision is mixed with another cursor or is negative" do
    scope, _message = setup

    expect(described_class.call(scope: scope, after_revision: 1, after: 1).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(scope: scope, after_revision: 1, around_id: 1).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(scope: scope, after_revision: -1).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(scope: scope, after_revision: "x").error_code)
      .to eq(:validation_failed)
  end

  it "acknowledges delivery after a fetch or catch-up (SCHEMA §5)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    message = Messages::Send.call(conversation: conversation, sender: peer.account, body: "Hi").value
    described_class.call(scope: conversation.messages, account: user.account)
    membership = conversation.conversation_memberships.find_by!(account: user.account)

    expect(membership.last_delivered_position).to eq(message.position)
  end

  it "does not ack when the page reports a newest position without messages" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    fake = instance_double(Messages::PageResult, newest_position: 1, messages: [])
    allow(Messages::Page).to receive(:call).and_return(fake)
    described_class.call(scope: conversation.messages, account: user.account)

    expect(conversation.conversation_memberships.find_by!(account: user.account).last_delivered_position).to eq(0)
  end

  it "does not ack an empty page" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    described_class.call(scope: conversation.messages, account: user.account)

    expect(conversation.conversation_memberships.find_by!(account: user.account).last_delivered_position).to eq(0)
  end

  it "picks the last message before around_at when none are on or after it" do
    scope, message = setup
    future = (message.created_at + 1.day).iso8601
    result = described_class.call(scope: scope, around_at: future)

    expect(result.value.messages).to eq([ message ])
  end
end
