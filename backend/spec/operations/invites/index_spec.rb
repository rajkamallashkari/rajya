require "rails_helper"

RSpec.describe Invites::Index do
  it "lists invites newest first" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    older = create(:group_invite, conversation: conversation, created_by_account: owner.account, created_at: 1.hour.ago)
    newer = create(:group_invite, conversation: conversation, created_by_account: owner.account)

    expect(described_class.call(conversation: conversation).value.invites).to eq([ newer, older ])
  end
end
