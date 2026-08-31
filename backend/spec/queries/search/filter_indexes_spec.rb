require "rails_helper"

# rubocop:disable RSpec/DescribeClass, RSpec/SpecFilePathFormat, RSpec/ExampleLength
RSpec.describe "NR-43 search filter indexes" do
  def talk
    user = create(:user)
    peer = create(:account)
    [ user, peer, create_direct_between(user.account, peer) ]
  end

  def explain(relation)
    Message.connection.execute("ANALYZE messages")
    Message.connection.execute("SET enable_seqscan = off")
    Message.connection.execute("SET enable_bitmapscan = off")
    Message.connection.select_values("EXPLAIN #{relation.to_sql}").join("\n")
  ensure
    Message.connection.execute("SET enable_seqscan = on")
    Message.connection.execute("SET enable_bitmapscan = on")
  end

  def seed(conversation, sender, count, **attrs)
    count.times do |index|
      create(:message, conversation: conversation, sender_account: sender, position: index + 1,
                       body: "filler #{index}", **attrs)
    end
  end

  it "adds the date, kind, attachment, and link indexes (NR-43)" do
    names = ActiveRecord::Base.connection.indexes(:messages).map(&:name)

    expect(names).to include(
      "idx_messages_conversation_sender_position",
      "idx_messages_conversation_created",
      "idx_messages_conversation_kind_created",
      "idx_messages_has_attachment",
      "idx_messages_has_link"
    )
  end

  it "uses the sender index on a large conversation and does not seq-scan" do
    user, peer, conversation = talk
    seed(conversation, user.account, 40)
    40.times do |index|
      create(:message, conversation: conversation, sender_account: peer, position: 41 + index,
                       body: "filler peer #{index}")
    end
    hits = Search::MessageHits.new(
      account: user.account,
      query: "",
      conversation: conversation,
      filters: Search::Filters.parse(sender_account_id: peer.id)
    )
    planned = explain(hits.relation)
    index_plan = explain(
      Message.where(conversation_id: conversation.id, sender_account_id: peer.id)
             .order(position: :desc)
             .limit(Settings.fetch(:search_page_size))
    )

    expect(planned).not_to include("Seq Scan")
    expect(index_plan).to include("idx_messages_conversation_sender_position")
    expect(hits.call.map { |hit| hit.message.sender_account_id }.uniq).to eq([ peer.id ])
  end

  it "uses an index for each advanced filter (NR-43)" do
    user, peer, conversation = talk
    seed(conversation, user.account, 30, kind: "text", attachment_count: 0)
    create(:message, conversation: conversation, sender_account: peer, kind: "image", attachment_count: 1,
                     body: "see https://example.com", position: 31)
    cases = {
      Search::Filters.parse(created_after: "2020-01-01T00:00:00Z") => "idx_messages_conversation_created",
      Search::Filters.parse(kind: "image") => "idx_messages_conversation_kind_created",
      Search::Filters.parse(has_attachment: true) => "idx_messages_has_attachment",
      Search::Filters.parse(has_link: true) => "idx_messages_has_link"
    }

    cases.each do |filters, index|
      relation = Search::MessageHits.new(
        account: user.account, query: "", conversation: conversation, filters: filters
      ).relation
      expect(explain(relation)).to include(index)
    end
  end

  it "keeps composed filters in the planner rather than a sequential scan" do
    user, peer, conversation = talk
    seed(conversation, user.account, 30)
    create(:message, conversation: conversation, sender_account: peer, kind: "image", attachment_count: 1,
                     body: "https://example.com/x", position: 31, created_at: Time.zone.parse("2026-02-02T12:00:00Z"))
    filters = Search::Filters.parse(
      sender_account_id: peer.id,
      created_after: "2026-02-01T00:00:00Z",
      kind: "image",
      has_attachment: true,
      has_link: true
    )
    plan = explain(
      Search::MessageHits.new(
        account: user.account, query: "", conversation: conversation, filters: filters
      ).relation
    )

    expect(plan).not_to include("Seq Scan")
  end
end
# rubocop:enable RSpec/DescribeClass, RSpec/SpecFilePathFormat, RSpec/ExampleLength
