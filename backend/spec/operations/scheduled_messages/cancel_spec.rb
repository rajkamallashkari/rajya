require "rails_helper"

RSpec.describe ScheduledMessages::Cancel do
  it "destroys a pending row owned by the actor" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value

    expect(described_class.call(scheduled_message: row, actor: user.account)).to be_success
    expect(ScheduledMessage.where(id: row.id)).not_to exist
  end

  it "forbids another account from cancelling" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value

    expect(described_class.call(scheduled_message: row, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
