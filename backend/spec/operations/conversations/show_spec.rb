require "rails_helper"

RSpec.describe Conversations::Show do
  it "returns a view with members preloaded" do
    owner = create(:user)
    member = create(:account)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member ])
    view = described_class.call(account: owner.account, conversation: conversation).value

    expect(view.include_members).to be(true)
    expect(view.membership.role).to eq("owner")
    expect(view.conversation.conversation_memberships.map(&:account_id)).to include(owner.account.id, member.id)
  end
end
