require "rails_helper"

RSpec.describe ConversationIdentityResource do
  it "serializes group identity without exposing its roster" do
    viewer = create(:user).account
    conversation = create_talk(kind: "group", owner: viewer, members: [ create(:account) ])
    json = described_class.new(Conversations::View.for(conversation, viewer)).to_h

    expect(json).to include(
      "id" => conversation.id,
      "kind" => "group",
      "title" => conversation.title,
      "avatar_url" => nil,
      "member_count" => 2,
      "peer" => nil
    )
    expect(json).not_to have_key("members")
  end

  it "serializes the peer for direct identity" do
    viewer = create(:user).account
    peer = create(:account)
    conversation = create_direct_between(viewer, peer)
    json = described_class.new(Conversations::View.for(conversation, viewer)).to_h

    expect(json.dig("peer", "id")).to eq(peer.id)
    expect(json.fetch("member_count")).to eq(2)
  end
end
