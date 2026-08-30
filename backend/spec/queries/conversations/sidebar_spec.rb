require "rails_helper"

RSpec.describe Conversations::Sidebar do
  let(:user) { create(:user) }

  it "orders by last_activity_at and preloads the sidebar associations" do
    older = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    older.update!(last_activity_at: 2.days.ago)
    newer = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    newer.update!(last_activity_at: Time.current)
    rows = described_class.call(scope: Conversation.where(id: [ older.id, newer.id ]), account: user.account)

    expect(rows.map(&:id)).to eq([ newer.id, older.id ])
    expect(rows.first.association(:last_message)).to be_loaded
    expect(rows.first.association(:conversation_memberships)).to be_loaded
  end

  it "sorts pinned conversations ahead of recency (NR-21)" do
    older = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    older.update!(last_activity_at: 2.days.ago)
    newer = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    newer.update!(last_activity_at: Time.current)
    Conversations::Pin.call(account: user.account, conversation: older)
    rows = described_class.call(scope: Conversation.where(id: [ older.id, newer.id ]), account: user.account)

    expect(rows.map(&:id)).to eq([ older.id, newer.id ])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      count.times { create_talk(kind: "group", owner: owner.account, members: [ create(:account) ]) }
      holder[:viewer] = owner.account
    end

    it "does not grow queries as the sidebar grows (F-4)" do
      expect do
        viewer = holder.fetch(:viewer)
        rows = described_class.call(
          scope: ConversationPolicy::Scope.new(viewer, Conversation.all).resolve,
          account: viewer
        )
        ConversationListResource.new(Conversations::List.new(conversations: rows, viewer: viewer)).to_h
      end.to perform_constant_number_of_queries
    end
  end
end
