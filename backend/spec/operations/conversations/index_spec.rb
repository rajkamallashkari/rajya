require "rails_helper"

RSpec.describe Conversations::Index do
  it "returns the account's conversations newest-activity first" do
    user = create(:user)
    older = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    older.update!(last_activity_at: 1.day.ago)
    newer = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    newer.update!(last_activity_at: Time.current)
    result = described_class.call(account: user.account, conversations: Conversation.where(id: [ older.id, newer.id ]))

    expect(result.value.conversations.map(&:id)).to eq([ newer.id, older.id ])
    expect(result.value.viewer).to eq(user.account)
  end

  it "lists pinned conversations before recency (NR-21)" do
    user = create(:user)
    older = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    older.update!(last_activity_at: 1.day.ago)
    newer = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    newer.update!(last_activity_at: Time.current)
    Conversations::Pin.call(account: user.account, conversation: older)
    result = described_class.call(account: user.account, conversations: Conversation.where(id: [ older.id, newer.id ]))

    expect(result.value.conversations.map(&:id)).to eq([ older.id, newer.id ])
  end

  it "omits archived conversations from the default list and returns them when asked (NR-14)" do
    user = create(:user)
    peer = create(:account)
    open_chat = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    archived = create_direct_between(user.account, peer)
    Conversations::Archive.call(account: user.account, conversation: archived)
    scope = Conversation.where(id: [ open_chat.id, archived.id ])

    default = described_class.call(account: user.account, conversations: scope)
    hidden = described_class.call(account: user.account, conversations: scope, archived: true)
    peer_list = described_class.call(account: peer, conversations: Conversation.where(id: archived.id))

    expect(default.value.conversations.map(&:id)).to eq([ open_chat.id ])
    expect(hidden.value.conversations.map(&:id)).to eq([ archived.id ])
    expect(peer_list.value.conversations.map(&:id)).to eq([ archived.id ])
  end
end
