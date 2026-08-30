require "rails_helper"

RSpec.describe ExportJobs::Payload do
  it "excludes left memberships and forwarding-restricted conversations (NR-32, NR-37)" do
    user = create(:user)
    kept = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    create(:message, conversation: kept, sender_account: user.account, body: "keep")
    restricted = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    restricted.update!(restrict_forwarding: true)
    create(:message, conversation: restricted, sender_account: user.account, body: "nope")
    left = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    ConversationMembership.active.find_by!(account: user.account, conversation: left).update!(status: "left")

    rows = described_class.call(account: user.account)

    expect(rows.map { |row| row.conversation.id }).to eq([ kept.id ])
    expect(rows.sole.messages.sole.body).to eq("keep")
  end

  it "scopes to one conversation when given" do
    user = create(:user)
    first = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    second = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    create(:message, conversation: first, sender_account: user.account)
    create(:message, conversation: second, sender_account: user.account)

    rows = described_class.call(account: user.account, conversation: second)

    expect(rows.map { |row| row.conversation.id }).to eq([ second.id ])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
      count.times do |index|
        create(:message, conversation: conversation, sender_account: owner.account, position: index + 1)
      end
      holder[:account] = owner.account
      holder[:conversation] = conversation
    end

    it "does not grow queries as the export grows" do
      expect do
        described_class.call(account: holder.fetch(:account), conversation: holder.fetch(:conversation))
      end.to perform_constant_number_of_queries
    end
  end
end
