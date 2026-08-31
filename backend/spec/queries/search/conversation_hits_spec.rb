require "rails_helper"

RSpec.describe Search::ConversationHits do
  it "matches group titles and direct peer names among active memberships" do
    user = create(:user)
    peer = create(:account, display_name: "Memento Peer")
    create_direct_between(user.account, peer)
    group = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    group.update!(title: "Memento Club")
    left = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    left.update!(title: "Memento Left")
    left.conversation_memberships.find_by!(account: user.account).update!(status: "left")

    hits = described_class.call(account: user.account, query: "memento")

    expect(hits.map(&:title)).to contain_exactly("Memento Peer", "Memento Club")
  end

  it "uses a blank title when there is no peer" do
    user = create(:user)
    solo = described_class.new(account: user.account, query: "ab")
    blank = Conversation.new(title: nil)
    allow(blank).to receive(:conversation_memberships).and_return([])
    expect(solo.send(:title_for, blank)).to eq("")
  end

  it "returns nothing when the query is shorter than the setting" do
    expect(described_class.call(account: create(:user).account, query: "a")).to eq([])
  end
end
