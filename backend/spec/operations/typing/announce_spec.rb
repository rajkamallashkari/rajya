require "rails_helper"

RSpec.describe Typing::Announce do
  include ActiveJob::TestHelper

  def setup
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    [ user, peer, conversation ]
  end

  it "writes an ephemeral key and does not create a message row" do
    user, _peer, conversation = setup

    expect {
      expect(described_class.call(account: user.account, conversation_id: conversation.id, activity: "typing"))
        .to be_success
    }.not_to change(Message, :count)
    expect(Typing::Store.read(conversation.id, user.account.id)).to eq("typing")
  end

  it "rejects a missing conversation, a stranger, a bot, and an unknown activity" do
    user, _peer, conversation = setup

    expect(described_class.call(account: user.account, conversation_id: 0).error_code).to eq(:not_found)
    expect(described_class.call(account: create(:user).account, conversation_id: conversation.id).error_code)
      .to eq(:forbidden)
    bot_account = create(:account, :bot_kind)
    create(:conversation_membership, conversation: conversation, account: bot_account)
    expect(described_class.call(account: bot_account, conversation_id: conversation.id).error_code)
      .to eq(:forbidden)
    expect(
      described_class.call(account: user.account, conversation_id: conversation.id, activity: "dancing").error_code
    ).to eq(:validation_failed)
  end

  it "defaults a blank activity to typing" do
    user, _peer, conversation = setup

    expect(described_class.call(account: user.account, conversation_id: conversation.id).value).to eq("typing")
  end

  it "does not enqueue push for typing (NR-3)" do
    user, _peer, conversation = setup

    expect {
      described_class.call(account: user.account, conversation_id: conversation.id, activity: "typing")
    }.not_to have_enqueued_job(Push::FanoutJob)
  end

  it "broadcasts when the activity kind changes inside the throttle window" do
    user, peer, conversation = setup
    captured = []
    allow(ActionCable.server).to receive(:broadcast) do |stream, payload|
      captured << { stream: stream, payload: payload }
    end

    described_class.call(account: user.account, conversation_id: conversation.id, activity: "typing")
    described_class.call(account: user.account, conversation_id: conversation.id, activity: "recording_audio")

    activities = captured.filter_map { |row| row.dig(:payload, "activity") }
    expect(activities.uniq).to eq(%w[typing recording_audio])
    expect(captured.map { |row| row.fetch(:stream) }).to include(Realtime.account_stream(peer.account.id))
  end

  it "does not rebroadcast the same activity inside the throttle window" do
    user, _peer, conversation = setup
    allow(Typing::Store).to receive_messages(read: "typing", claim_broadcast?: false)
    allow(Typing::Store).to receive(:write)
    allow(ActionCable.server).to receive(:broadcast)
    described_class.call(account: user.account, conversation_id: conversation.id, activity: "typing")

    expect(ActionCable.server).not_to have_received(:broadcast)
  end
end
