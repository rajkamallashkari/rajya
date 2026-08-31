require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- filter matrix
RSpec.describe Search::MessageHits do
  def talk(user)
    create_direct_between(user.account, create(:account))
  end

  def filters(**attrs)
    Search::Filters.parse(attrs)
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

  it "applies sender, date, kind, attachment, and link filters in SQL (NR-43)" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    keep = create(:message, conversation: conversation, sender_account: peer, body: "see https://example.com atoms",
                            kind: "image", attachment_count: 1, position: 1, created_at: Time.zone.parse("2026-02-02T12:00:00Z"))
    create(:message, conversation: conversation, sender_account: user.account, body: "atoms only",
                     kind: "text", attachment_count: 0, position: 2, created_at: Time.zone.parse("2026-02-02T12:00:00Z"))
    create(:message, conversation: conversation, sender_account: peer, body: "atoms photo",
                     kind: "image", attachment_count: 1, position: 3, created_at: Time.zone.parse("2025-01-01T12:00:00Z"))
    create(:message, conversation: conversation, sender_account: peer, body: "atoms https://skip.example",
                     kind: "video", attachment_count: 1, position: 4, created_at: Time.zone.parse("2026-02-02T12:00:00Z"))

    hits = described_class.call(
      account: user.account,
      query: "atoms",
      conversation: conversation,
      filters: filters(
        sender_account_id: peer.id,
        created_after: "2026-02-01T00:00:00Z",
        created_before: "2026-02-03T00:00:00Z",
        kind: "image",
        has_attachment: true,
        has_link: true
      )
    )
    sql = described_class.new(
      account: user.account,
      query: "atoms",
      conversation: conversation,
      filters: filters(sender_account_id: peer.id, kind: "image", has_attachment: true, has_link: true)
    ).relation.to_sql

    expect(hits.sole.message.id).to eq(keep.id)
    expect(sql).to include("sender_account_id")
    expect(sql).to include("attachment_count")
    expect(sql).to include("https?")
  end

  it "supports filter-only search and inverted attachment/link predicates" do
    user = create(:user)
    conversation = talk(user)
    plain = create(:message, conversation: conversation, sender_account: user.account, body: "no url",
                             attachment_count: 0, position: 1)
    create(:message, conversation: conversation, sender_account: user.account,
                     body: "https://example.com/file", attachment_count: 2, position: 2)

    none = described_class.call(account: user.account, query: "", conversation: conversation)
    hits = described_class.call(
      account: user.account,
      query: "",
      conversation: conversation,
      filters: filters(has_attachment: false, has_link: false)
    )

    expect(none).to eq([])
    expect(hits.sole.message.id).to eq(plain.id)
  end

  it "filters a global search by sender" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    create(:message, conversation: conversation, sender_account: user.account, body: "shared needle", position: 1)
    kept = create(:message, conversation: conversation, sender_account: peer, body: "shared needle", position: 2)

    hits = described_class.call(
      account: user.account,
      query: "needle",
      filters: filters(sender_account_id: peer.id)
    )

    expect(hits.sole.message.id).to eq(kept.id)
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      conversation = create_direct_between(owner.account, create(:account))
      count.times do |index|
        create(:message, conversation: conversation, sender_account: owner.account, body: "needle #{index}",
                         position: index + 1)
      end
      holder[:account] = owner.account
      holder[:conversation] = conversation
    end

    it "does not grow queries as hits grow" do
      Settings.fetch(:search_page_size)
      Settings.fetch(:search_snippet_radius)
      expect do
        described_class.call(account: holder[:account], query: "needle", conversation: holder[:conversation])
      end.to perform_constant_number_of_queries
    end
  end
end
# rubocop:enable RSpec/ExampleLength
