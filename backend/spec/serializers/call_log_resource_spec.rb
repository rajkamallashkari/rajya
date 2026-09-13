require "rails_helper"

RSpec.describe CallLogResource do
  let(:user) { create(:user) }
  let(:peer) { create(:account) }
  let(:conversation) { create_direct_between(user.account, peer) }
  let(:call) { create(:call, :ended, conversation:, initiator_account: user.account) }

  it "includes the peer on a direct call and omits it on a group call" do
    create(:call_participant, call: call, account: user.account, status: "left")
    create(:call_participant, call: call, account: peer, status: "left")
    json = described_class.new(Calls::Page::Entry.new(call: call, viewer: user.account)).to_h

    expect(json).to include(
      "avatar_url" => nil,
      "conversation_kind" => "direct",
      "member_count" => 2,
      "title" => peer.display_name
    )
    expect(json.dig("peer", "id")).to eq(peer.id)
  end
end
