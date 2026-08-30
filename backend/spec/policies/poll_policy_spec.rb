require "rails_helper"

RSpec.describe PollPolicy do
  def poll_for(sender, conversation)
    Messages::Send.call(
      conversation: conversation, sender: sender,
      poll: { question: "Policy?", options: %w[Yes No] }
    ).value.poll
  end

  it "allows any member to vote and the author to close" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    poll = poll_for(user.account, conversation)
    peer = conversation.conversation_memberships.where.not(account: user.account).sole.account

    expect(described_class.new(user.account, poll)).to be_show.and be_vote.and be_close
    expect(described_class.new(peer, poll)).to be_vote
    expect(described_class.new(peer, poll)).not_to be_close
  end

  it "lets a group admin close someone else's poll" do
    owner = create(:user)
    admin = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, admins: [ admin.account ])
    poll = poll_for(owner.account, conversation)
    expect(described_class.new(admin.account, poll)).to be_close
  end

  it "denies close when the viewer cannot see the poll or is only a member" do
    owner = create(:user)
    member = create(:user)
    stranger = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    poll = poll_for(owner.account, conversation)

    expect(described_class.new(member.account, poll)).not_to be_close
    expect(described_class.new(stranger.account, poll)).not_to be_close
    expect(described_class.new(nil, poll)).not_to be_close
    expect(described_class.new(owner.account, build(:message))).not_to be_close
  end

  it "does not close when the poll or account is missing after show is allowed" do
    owner = create(:user)
    poll = poll_for(owner.account, create_direct_between(owner.account, create(:account)))
    visible = instance_double(ConversationPolicy, show?: true, send?: true)

    orphan = described_class.new(owner.account, build(:message))
    allow(orphan).to receive(:conversation_policy).and_return(visible)
    expect(orphan).not_to be_close

    unsigned = described_class.new(nil, poll)
    allow(unsigned).to receive(:conversation_policy).and_return(visible)
    expect(unsigned).not_to be_close
  end

  it "scopes to conversations the account can see" do
    user = create(:user)
    poll = poll_for(user.account, create_direct_between(user.account, create(:account)))
    create(:poll)
    expect(described_class::Scope.new(user.account, Poll.all).resolve).to contain_exactly(poll)
    expect(described_class::Scope.new(nil, Poll.all).resolve).to be_empty
  end
end
