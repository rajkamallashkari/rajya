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

  it "clears a manual unread mark when opening (NR-22)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    Conversations::MarkUnread.call(account: owner.account, conversation: conversation)

    described_class.call(account: owner.account, conversation: conversation, clear_unread: true)

    expect(Conversations::View.for(conversation.reload, owner.account).membership.manually_unread_at).to be_nil
  end

  it "leaves the unread mark when clear_unread is false and skips a missing membership" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    Conversations::MarkUnread.call(account: owner.account, conversation: conversation)

    described_class.call(account: owner.account, conversation: conversation, clear_unread: false)
    expect(Conversations::View.for(conversation.reload, owner.account).membership.manually_unread_at).to be_present

    stranger_conversation = create_direct_between(create(:account), create(:account))
    described_class.call(account: owner.account, conversation: stranger_conversation, clear_unread: true)
  end
end
