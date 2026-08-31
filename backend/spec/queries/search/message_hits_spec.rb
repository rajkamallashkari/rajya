require "rails_helper"

RSpec.describe Search::MessageHits do
  def talk(user)
    create_direct_between(user.account, create(:account))
  end

  it "returns newest matching messages and omits tombstones" do
    user = create(:user)
    conversation = talk(user)
    kept = create(:message, conversation: conversation, sender_account: user.account, body: "memento atoms",
                            position: 1, created_at: 2.days.ago)
    create(:message, conversation: conversation, sender_account: user.account, body: "memento later",
                     position: 2, created_at: 1.day.ago)
    gone = create(:message, conversation: conversation, sender_account: user.account, body: "memento gone",
                            position: 3, created_at: Time.current)
    gone.update!(deleted_at: Time.current)

    hits = described_class.call(account: user.account, query: "memento")

    expect(hits.map { |hit| hit.message.body }).to eq([ "memento later", kept.body ])
    expect(hits.map { |hit| hit.message.id }).not_to include(gone.id)
  end

  it "excludes left memberships and includes archived chats" do
    user = create(:user)
    archived = talk(user)
    left = talk(user)
    create(:message, conversation: archived, sender_account: user.account, body: "virtue archived")
    create(:message, conversation: left, sender_account: user.account, body: "virtue left")
    archived.conversation_memberships.find_by!(account: user.account).update!(archived_at: Time.current)
    left.conversation_memberships.find_by!(account: user.account).update!(status: "left")

    hits = described_class.call(account: user.account, query: "virtue")

    expect(hits.map { |hit| hit.message.conversation_id }).to eq([ archived.id ])
  end

  it "returns one hit per conversation when distinct" do
    user = create(:user)
    conversation = talk(user)
    create(:message, conversation: conversation, sender_account: user.account, body: "practice one", position: 1)
    newer = create(:message, conversation: conversation, sender_account: user.account, body: "practice two", position: 2)

    hits = described_class.call(account: user.account, query: "practice", distinct_conversation: true)

    expect(hits.sole.message.id).to eq(newer.id)
  end

  it "scopes to one conversation and reports forwarding" do
    user = create(:user)
    inside = talk(user)
    outside = talk(user)
    create(:message, conversation: inside, sender_account: user.account, body: "atoms inside")
    create(:message, conversation: outside, sender_account: user.account, body: "atoms outside")
    inside.update!(restrict_forwarding: true)

    hits = described_class.call(account: user.account, query: "atoms", conversation: inside)

    expect(hits.sole.can_forward).to be(false)
    expect(hits.sole.message.conversation_id).to eq(inside.id)
    expect(described_class.call(account: user.account, query: "???")).to eq([])
  end
end
