require "rails_helper"

RSpec.describe Calls::History do
  def ringing_call
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    [ conversation, call ]
  end

  it "edits the same bubble from ringing to active to ended (BR-67)" do
    conversation, call = ringing_call
    first = Message.where(conversation: conversation, kind: "system").find { |row| row.metadata["call_id"] == call.id }
    call.update!(status: "active", started_at: Time.current)
    active = described_class.call(call: call).value
    call.update!(status: "ended", ended_at: Time.current, duration_seconds: 72)
    ended = described_class.call(call: call.reload).value

    expect(active.id).to eq(first.id)
    expect(ended.id).to eq(first.id)
    expect(ended.system_event).to eq("call_ended")
    expect(Message.where(conversation: conversation, kind: "system").count).to eq(1)
  end

  it "renders busy copy and duration copy from the catalog" do
    _conversation, call = ringing_call
    call.update!(status: "missed", ended_at: Time.current)
    expect(described_class.call(call: call, busy: true).value.body).to eq(Catalog.t("system_events.call_busy"))

    call.update!(status: "ended", started_at: 1.minute.ago, ended_at: Time.current, duration_seconds: 72, kind: "video")
    expect(described_class.call(call: call.reload).value.body).to include("1m")
  end

  it "creates a bubble when none exists yet and rejects a missing call" do
    call = create(:call, :ended, started_at: 1.minute.ago, ended_at: Time.current, duration_seconds: 12)
    expect(described_class.call(call: call).value.system_event).to eq("call_ended")
    expect(described_class.call(call: nil).error_code).to eq(:not_found)
  end

  it "syncs an existing bubble when a duplicate insert is rejected (BR-67)" do
    conversation, call = ringing_call
    existing = Message.where(conversation: conversation, kind: "system").find { |row| row.metadata["call_id"] == call.id }
    history = described_class.new
    history.instance_variable_set(:@call, call)
    history.instance_variable_set(:@busy, false)
    allow(history).to receive(:find_message).and_return(existing)
    allow(Message).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique.new("dup"))

    expect(history.send(:persist_new!).id).to eq(existing.id)
  end
end
