require "rails_helper"

RSpec.describe ConversationChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes an active member to the conversation stream" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.conversation_stream(conversation.id))
  end

  it "rejects a non-member" do
    conversation = create_direct_between(create(:account), create(:account))
    subscribe conversation_id: conversation.id

    expect(subscription).to be_rejected
  end

  it "rejects a missing conversation" do
    subscribe conversation_id: 0

    expect(subscription).to be_rejected
  end

  it "untracks the subscriber when the socket closes" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    expect(Receipts::Subscribers.account_ids(conversation.id)).to eq([ user.account.id ])

    unsubscribe
    expect(Receipts::Subscribers.account_ids(conversation.id)).to eq([])
  end

  it "does not remove subscribers when tracking was never set" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    subscription.instance_variable_set(:@tracking_conversation_id, nil)
    unsubscribe
    expect(Receipts::Subscribers.account_ids(conversation.id)).to eq([ user.account.id ])
  end

  Typing::Store::ACTIVITIES.each do |activity|
    it "broadcasts #{activity} on an ephemeral key without writing a row (NR-3, NR-40)" do
      conversation = create_direct_between(user.account, create(:account))
      subscribe conversation_id: conversation.id
      captured = []
      allow(ActionCable.server).to receive(:broadcast) { |stream, payload| captured << [ stream, payload ] }

      expect { perform :typing, activity: activity }.not_to change(Message, :count)
      expect(Typing::Store.read(conversation.id, user.account.id)).to eq(activity)
      expect(captured.assoc(Realtime.conversation_stream(conversation.id)).last).to include(
        "type" => "typing", "activity" => activity, "account_id" => user.account.id
      )
    end
  end

  it "expires typing without a cleanup job" do
    expect(Dir[Rails.root.join("app/jobs/**/*typing*")]).to be_empty
  end

  it "reads activity from string keys as the socket sends them" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    subscription.perform_action("action" => "typing", "activity" => "uploading_file")

    expect(Typing::Store.read(conversation.id, user.account.id)).to eq("uploading_file")
  end

  it "skips typing when the subscription never tracked a conversation" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    subscription.instance_variable_set(:@tracking_conversation_id, nil)
    expect { perform :typing, activity: "typing" }.not_to change(Message, :count)
    expect(Typing::Store.read(conversation.id, user.account.id)).to be_nil
  end

  it "sets the cancel flag from the socket without writing a row" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id

    expect { perform :cancel, generation_id: "9:8:7" }.not_to change(Message, :count)
    expect(Ai::Cancellation.requested?("9:8:7")).to be(true)
  end

  it "skips cancel when the subscription never tracked a conversation" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    subscription.instance_variable_set(:@tracking_conversation_id, nil)
    perform :cancel, generation_id: "skip"
    expect(Ai::Cancellation.requested?("skip")).to be(false)
  end

  it "skips cancel when the conversation no longer exists" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id
    conversation.destroy!
    perform :cancel, generation_id: "gone"
    expect(Ai::Cancellation.requested?("gone")).to be(false)
  end
end
