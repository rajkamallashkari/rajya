require "rails_helper"

RSpec.describe Conversations::Create do
  it "dispatches direct, group, channel, and rejects an unknown kind" do
    creator = create(:user).account
    peer = create(:account)
    other = create(:account)

    direct = described_class.call(creator: creator, kind: "direct", account_id: peer.id)
    group = described_class.call(creator: creator, kind: "group", account_ids: [ other.id ], title: "Team")
    channel = described_class.call(creator: creator, kind: "channel", account_ids: [ other.id ], title: "News")

    expect(direct.value.conversation.kind).to eq("direct")
    expect(group.value.conversation.kind).to eq("group")
    expect(channel.value.conversation.kind).to eq("channel")
    expect(described_class.call(creator: creator, kind: "broadcast").error_code).to eq(:validation_failed)
  end
end
