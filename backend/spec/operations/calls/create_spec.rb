require "rails_helper"

RSpec.describe Calls::Create do
  def pair
    initiator = create(:user)
    callee = create(:user)
    [ initiator, callee, create_direct_between(initiator.account, callee.account) ]
  end

  before { enable_webrtc_calls! }

  it "creates a ringing call, writes history, and notifies the callee (BR-67)" do
    initiator, callee, conversation = pair
    captured = capture_cable

    result = described_class.call(account: initiator.account, conversation: conversation, kind: "video")
    call = result.value.call

    expect(call).to have_attributes(kind: "video", status: "ringing")
    expect(
      [ call.participant_for(initiator.account.id).status, call.participant_for(callee.account.id).status ]
    ).to eq(%w[joined ringing])
    expect(Message.where(conversation: conversation, system_event: "call_started").count).to eq(1)
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("incoming_call")
  end

  it "marks a live callee busy and misses the call when every callee is busy (BR-63)" do
    initiator, callee, conversation = pair
    other = create_direct_between(callee.account, create(:user).account)
    described_class.call(account: callee.account, conversation: other, kind: "audio")
    captured = capture_cable

    result = described_class.call(account: initiator.account, conversation: conversation, kind: "audio")
    call = result.value.call

    expect(call.status).to eq("missed")
    expect(call.participant_for(callee.account.id).status).to eq("busy")
    expect(captured.map { |row| row.dig(:payload, "type") }).to include("busy")
    bubbles = Message.where(conversation: conversation, kind: "system").select { |row| row.metadata["call_id"] == call.id }
    expect(bubbles.map(&:body)).to eq([ Catalog.t("system_events.call_busy") ])
  end

  it "rejects a second live call for the initiator as conflict" do
    initiator, _callee, conversation = pair
    described_class.call(account: initiator.account, conversation: conversation, kind: "audio")

    expect(described_class.call(account: initiator.account, conversation: conversation, kind: "audio").error_code)
      .to eq(:conflict)
  end

  it "maps a unique-index race to already_in_call (BR-63)" do
    initiator, _callee, conversation = pair
    allow(Call).to receive(:live_for?).and_return(false)
    create(:call_participant, :joined, call: create(:call, :active), account: initiator.account)

    expect(described_class.call(account: initiator.account, conversation: conversation, kind: "audio").error_code)
      .to eq(:conflict)
  end

  it "rejects a missing flag as not found" do
    initiator, _callee, conversation = pair
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, conversation: conversation, kind: "audio").error_code)
      .to eq(:not_found)
  end

  it "rejects a bot as forbidden" do
    initiator, _callee, conversation = pair
    bot = create(:bot)
    create(:conversation_membership, conversation: conversation, account: bot.account)
    expect(described_class.call(account: bot.account, conversation: conversation, kind: "audio").error_code)
      .to eq(:forbidden)
  end

  it "rejects a bad kind as validation failed" do
    initiator, _callee, conversation = pair
    expect(described_class.call(account: initiator.account, conversation: conversation, kind: "screen").error_code)
      .to eq(:validation_failed)
  end

  it "rejects an oversized group" do
    initiator, _callee, _conversation = pair
    members = create_list(:user, Settings.fetch(:mesh_participant_cap))
    group = create_talk(kind: "group", owner: initiator.account, members: members.map(&:account))
    expect(described_class.call(account: initiator.account, conversation: group, kind: "audio").error_details)
      .to eq({ reason: "too_many_participants" })
  end

  it "rejects a conversation with fewer than two humans" do
    owner = create(:user)
    group = create_talk(kind: "group", owner: owner.account)

    expect(described_class.call(account: owner.account, conversation: group, kind: "audio").error_details)
      .to eq({ reason: "insufficient_participants" })
  end
end
