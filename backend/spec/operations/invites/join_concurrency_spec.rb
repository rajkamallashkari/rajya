require "rails_helper"

RSpec.describe Invites::Join, :concurrent do
  def in_parallel(users, &)
    threads = users.map do |user|
      Thread.new do
        Rails.application.executor.wrap do
          ActiveRecord::Base.connection_pool.with_connection { yield user }
        end
      end
    end
    threads.each(&:join)
  end

  it "lets exactly one of N parallel joins succeed when max_uses is 1 (F-14)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account, max_uses: 1)
    joiners = create_list(:user, 8)

    in_parallel(joiners) { |user| described_class.call(invite: invite, account: user.account) }

    expect(invite.reload.uses_count).to eq(1)
    expect(conversation.conversation_memberships.active.where(account: joiners.map(&:account)).count).to eq(1)
  end
end
