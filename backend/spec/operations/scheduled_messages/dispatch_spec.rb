require "rails_helper"

RSpec.describe ScheduledMessages::Dispatch do
  def due_recurring(conversation, sender, **attrs)
    create(:preference, account: sender, data: { "locale" => { "timezone" => "UTC" } })
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: sender, body: "Daily",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=DAILY;COUNT=3", **attrs
    ).value
    row.tap { |r| r.update_columns(scheduled_at: 1.minute.ago, next_run_at: 1.minute.ago) }
  end

  it "keeps a recurring row and advances next_run_at" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = due_recurring(conversation, user.account)
    result = described_class.call(scheduled_message: row.reload)

    expect(result.value.body).to eq("Daily")
    expect(row.reload.occurrences_sent).to eq(1)
    expect(row.next_run_at).to be > Time.current
  end

  it "omits client_nonce after the first recurring send" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    nonce = "11111111-1111-1111-1111-111111111111"
    row = due_recurring(conversation, user.account, client_nonce: nonce)
    described_class.call(scheduled_message: row.reload)
    row.update_columns(next_run_at: 1.minute.ago)
    described_class.call(scheduled_message: row.reload)

    expect(conversation.messages.order(:position).pluck(:client_nonce)).to eq([ nonce, nil ])
  end

  it "destroys a COUNT=1 series after the first send" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Once",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=DAILY;COUNT=1"
    ).value
    row.update_columns(scheduled_at: 1.minute.ago, next_run_at: 1.minute.ago)
    described_class.call(scheduled_message: row.reload)

    expect(ScheduledMessage.where(id: row.id)).not_to exist
    expect(conversation.messages.pluck(:body)).to eq([ "Once" ])
  end

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

  it "destroys a recurring row when send is forbidden" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Daily",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=DAILY"
    ).value
    conversation.conversation_memberships.find_by!(account: user.account).update!(status: "left")
    row.update_columns(scheduled_at: 1.minute.ago, next_run_at: 1.minute.ago)
    result = described_class.call(scheduled_message: row.reload)

    expect(result.error_code).to eq(:forbidden)
    expect(ScheduledMessage.where(id: row.id)).not_to exist
  end

  it "falls back to Time.zone when the preference timezone is unknown" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    create(:preference, account: user.account, data: { "locale" => { "timezone" => "Not/AZone" } })
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Daily",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=DAILY;COUNT=3"
    ).value
    row.update_columns(scheduled_at: 1.minute.ago, next_run_at: 1.minute.ago)
    described_class.call(scheduled_message: row.reload)

    expect(row.reload.next_run_at).to be > Time.current
  end
end
