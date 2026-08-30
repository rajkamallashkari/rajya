require "rails_helper"

RSpec.describe ScheduledMessages::Dispatch do
  it "sends through Messages::Send and destroys the staging row" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    result = described_class.call(scheduled_message: row)

    expect(result.value.body).to eq("Later")
    expect(result.value.conversation_id).to eq(conversation.id)
    expect(ScheduledMessage.where(id: row.id)).not_to exist
  end

  it "still destroys the row when send is forbidden" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    conversation.conversation_memberships.find_by!(account: user.account).update!(status: "left")
    result = described_class.call(scheduled_message: row)

    expect(result.error_code).to eq(:forbidden)
    expect(ScheduledMessage.where(id: row.id)).not_to exist
  end
end
