require "rails_helper"

RSpec.describe Realtime do
  include ActiveJob::TestHelper

  def captured
    @captured ||= []
  end

  def capture_broadcasts!
    allow(ActionCable.server).to receive(:broadcast) do |stream, payload|
      captured << { stream: stream, payload: payload }
    end
  end

  before { capture_broadcasts! }

  it "broadcasts immediately when no joinable transaction is open" do
    described_class.publish("account:1", :phone_verified, "phone" => "1")

    expect(captured).to contain_exactly(
      stream: "account:1", payload: { "type" => "phone_verified", "phone" => "1" }
    )
  end

  it "does not broadcast events from rolled-back data" do
    ActiveRecord::Base.transaction(requires_new: true) do
      described_class.publish("conversation:1", :message_created, "message_id" => 1)
      raise ActiveRecord::Rollback
    end

    expect(captured).to eq([])
  end

  it "flushes after the wrapping transaction commits" do
    ActiveRecord::Base.transaction(requires_new: true) do
      described_class.publish("account:1", :phone_verified, "phone" => "1")
      described_class.publish("account:1", :phone_verified, "phone" => "2")
      expect(captured).to eq([])
    end

    expect(captured.size).to eq(2)
  end

  it "resolves conversation recipients once and broadcasts once per stream (F-19)" do
    owner = create(:user)
    members = create_list(:account, 2)
    conversation = create_talk(kind: "group", owner: owner.account, members: members)

    described_class.publish(conversation, :message_created, "message_id" => 9)

    streams = captured.map { |row| row.fetch(:stream) }
    expect(streams).to include(described_class.conversation_stream(conversation.id))
    expect(streams).to include(described_class.account_stream(owner.account.id))
    expect(streams.uniq.size).to eq(streams.size)
  end

  it "enqueues one push job carrying the full recipient list (F-19)" do
    owner = create(:user)
    member = create(:account)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member ])

    expect { described_class.publish(conversation, :message_created, "message_id" => 9) }
      .to have_enqueued_job(Push::FanoutJob).once.with(
        "message_created",
        hash_including("message_id" => 9, "conversation_id" => conversation.id),
        contain_exactly(owner.account.id, member.id)
      )
  end

  it "does not fan out sidebar or push for an account stream" do
    expect { described_class.publish("account:4", :message_reminder, "id" => 1) }
      .not_to have_enqueued_job(Push::FanoutJob)

    expect(captured.map { |row| row.fetch(:stream) }).to eq([ "account:4" ])
  end

  it "accepts a Message as payload and a Conversation as the target" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation)

    described_class.publish(conversation, :message_created, message)

    expect(captured.first.fetch(:payload)).to include(
      "type" => "message_created",
      "message_id" => message.id,
      "conversation_id" => conversation.id
    )
  end

  it "rejects a target that is not a conversation, account, or stream name" do
    expect { described_class.publish(1, :phone_verified) }.to raise_error(ArgumentError)
  end

  it "rejects an event that is not in the client union" do
    expect { described_class.publish("account:1", :noop) }.to raise_error(ArgumentError, /noop/)
  end

  it "publishes to an Account stream and treats a blank payload as empty data" do
    account = create(:account)
    described_class.publish(account, :phone_verified)
    described_class.publish("account:1", :phone_verified, nil)

    expect(captured.first.fetch(:stream)).to eq(described_class.account_stream(account.id))
    expect(captured.last.fetch(:payload)).to eq("type" => "phone_verified")
  end

  it "does not broadcast when a messaging operation is rolled back" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))

    ActiveRecord::Base.transaction(requires_new: true) do
      Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi")
      raise ActiveRecord::Rollback
    end

    expect(captured).to eq([])
    expect(conversation.messages.count).to eq(0)
  end

  it "advances delivered for live conversation subscribers (SCHEMA §5)" do
    sender = create(:user)
    peer = create(:user)
    conversation = create_direct_between(sender.account, peer.account)
    Receipts::Subscribers.add(conversation.id, peer.account.id)
    Receipts::Subscribers.add(conversation.id, sender.account.id)
    message = Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi").value
    membership = conversation.conversation_memberships.find_by!(account: peer.account)

    expect(membership.last_delivered_position).to eq(message.position)
  end

  it "skips a live subscriber that no longer exists" do
    sender = create(:user)
    conversation = create_direct_between(sender.account, create(:account))
    Receipts::Subscribers.add(conversation.id, 0)
    expect(
      Messages::Send.call(conversation: conversation, sender: sender.account, body: "Hi")
    ).to be_success
  end

  it "is a no-op when the buffer is empty" do
    described_class.flush!

    expect(captured).to eq([])
  end

  it "flushes when the connection has no open transaction" do
    allow(ActiveRecord::Base.connection).to receive(:transaction_open?).and_return(false)
    described_class.publish("account:1", :phone_verified)

    expect(captured.size).to eq(1)
  end
end
