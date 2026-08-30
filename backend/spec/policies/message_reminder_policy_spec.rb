require "rails_helper"

RSpec.describe MessageReminderPolicy do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    row = create(:message_reminder, account: user.account, message: message)
    [ user, row ]
  end

  it "allows the owner to update and destroy" do
    user, row = setup
    policy = described_class.new(user.account, row)
    expect(policy).to be_update.and be_destroy
    expect(described_class.new(user.account, MessageReminder)).to be_index.and be_create
  end

  it "denies another account and scopes to the owner" do
    user, row = setup
    other = create(:user)
    expect(described_class.new(other.account, row)).not_to be_update
    expect(described_class::Scope.new(user.account, MessageReminder.all).resolve).to contain_exactly(row)
    expect(described_class::Scope.new(nil, MessageReminder.all).resolve).to be_empty
  end

  it "denies update on a class record" do
    _user, row = setup
    expect(described_class.new(create(:user).account, MessageReminder)).not_to be_update
    expect(described_class.new(nil, row)).not_to be_update
  end
end
