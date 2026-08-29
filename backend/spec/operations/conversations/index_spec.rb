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
end
