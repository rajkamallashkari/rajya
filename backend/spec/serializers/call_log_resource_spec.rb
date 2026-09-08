require "rails_helper"

RSpec.describe CallLogResource do
  it "includes the peer on a direct call and omits it on a group call" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    call = create(:call, :ended, conversation: conversation, initiator_account: user.account)
    create(:call_participant, call: call, account: user.account, status: "left")
    create(:call_participant, call: call, account: peer, status: "left")
    json = described_class.new(Calls::Page::Entry.new(call: call, viewer: user.account)).to_h

    expect(json).to include("conversation_kind" => "direct", "title" => peer.display_name)
    expect(json.dig("peer", "id")).to eq(peer.id)
  end
end
