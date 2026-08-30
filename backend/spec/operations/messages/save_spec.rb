require "rails_helper"

RSpec.describe Messages::Save do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, message ]
  end

  it "saves privately and is idempotent" do
    user, message = setup
    first = described_class.call(message: message, actor: user.account).value
    second = described_class.call(message: message, actor: user.account).value

    expect(first.id).to eq(second.id)
    expect(SavedMessage.where(account: user.account, message: message).count).to eq(1)
  end

  it "rejects a deleted message and a stranger" do
    user, message = setup
    Messages::Unsend.call(message: message, actor: user.account)

    expect(described_class.call(message: message.reload, actor: user.account).error_code).to eq(:not_found)
    expect(described_class.call(message: message, actor: create(:user).account).error_code).to eq(:forbidden)
  end

  it "returns the existing row when a concurrent insert wins" do
    user, message = setup
    existing = described_class.call(message: message, actor: user.account).value
    allow(SavedMessage).to receive(:find_or_create_by!).and_raise(ActiveRecord::RecordNotUnique.new("x"))
    allow(SavedMessage).to receive(:find_by!).and_return(existing)

    expect(described_class.call(message: message, actor: user.account).value.id).to eq(existing.id)
  end
end
