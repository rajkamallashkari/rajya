require "rails_helper"

RSpec.describe SlowMode do
  include ActiveSupport::Testing::TimeHelpers
  def group_member
    member = create(:user)
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    [ owner, member, conversation ]
  end

  it "returns remaining seconds from persisted last_message_at (S-18)" do
    freeze_time do
      _owner, member, conversation = group_member
      conversation.update!(slow_mode_seconds: 10)
      membership = conversation.conversation_memberships.find_by!(account: member.account)
      membership.update_columns(last_message_at: Time.current)

      expect(described_class.retry_after(conversation: conversation.reload, sender: member.account)).to eq(10)
    end
  end

  it "exempts admins and owners and skips when slow mode is off" do
    freeze_time do
      owner, member, conversation = group_member
      conversation.update!(slow_mode_seconds: 10)
      described_class.touch!(conversation: conversation, sender: member.account)
      described_class.touch!(conversation: conversation, sender: owner.account)

      expect(described_class.retry_after(conversation: conversation, sender: owner.account)).to be_nil
      conversation.update!(slow_mode_seconds: 0)
      expect(described_class.retry_after(conversation: conversation, sender: member.account)).to be_nil
    end
  end

  it "does not block when the member has never posted or the cooldown has elapsed" do
    freeze_time do
      _owner, member, conversation = group_member
      conversation.update!(slow_mode_seconds: 10)
      expect(described_class.retry_after(conversation: conversation, sender: member.account)).to be_nil

      conversation.conversation_memberships.find_by!(account: member.account)
                  .update_columns(last_message_at: 11.seconds.ago)
      expect(described_class.retry_after(conversation: conversation, sender: member.account)).to be_nil
    end
  end

  it "skips a sender with no membership" do
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    conversation.update!(slow_mode_seconds: 10)

    expect(described_class.retry_after(conversation: conversation, sender: create(:user).account)).to be_nil
  end
end
