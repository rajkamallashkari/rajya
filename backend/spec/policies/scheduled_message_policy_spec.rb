require "rails_helper"

RSpec.describe ScheduledMessagePolicy do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    [ user, row ]
  end

  it "allows the owner to update, destroy, and send_now" do
    user, row = setup
    policy = described_class.new(user.account, row)

    expect(policy).to be_update.and be_destroy.and be_send_now
    expect(described_class.new(user.account, ScheduledMessage)).to be_index.and be_create
  end

  it "denies another account and scopes to the owner" do
    user, row = setup
    other = create(:user)

    expect(described_class.new(other.account, row)).not_to be_update
    expect(described_class::Scope.new(user.account, ScheduledMessage.all).resolve).to contain_exactly(row)
    expect(described_class::Scope.new(nil, ScheduledMessage.all).resolve).to be_empty
  end

  it "denies update on a class record and with no acting account" do
    _user, row = setup
    expect(described_class.new(create(:user).account, ScheduledMessage)).not_to be_update
    expect(described_class.new(nil, row)).not_to be_update
  end
end
