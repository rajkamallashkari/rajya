require "rails_helper"

RSpec.describe InviteJoinResource do
  it "serializes a joined conversation and a pending outcome without one" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    view = Conversations::MembershipSupport.view(owner.account, conversation)
    joined = described_class.new(Invites::JoinOutcome.new(status: "joined", conversation: view)).to_h
    pending = described_class.new(Invites::JoinOutcome.new(status: "pending_approval", conversation: nil)).to_h

    expect(joined.fetch("status")).to eq("joined")
    expect(joined.fetch("conversation").fetch("id")).to eq(conversation.id)
    expect(pending).to include("status" => "pending_approval", "conversation" => nil)
  end
end
