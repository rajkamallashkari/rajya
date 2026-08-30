require "rails_helper"

RSpec.describe Conversations::HumanMembers do
  it "returns active human member ids and omits bots and leavers" do
    owner = create(:user)
    human = create(:account)
    bot = create(:bot).account
    leaver = create(:account)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ human, bot, leaver ])
    conversation.conversation_memberships.find_by!(account: leaver).update!(status: "left")

    expect(described_class.call(conversation_id: conversation.id))
      .to contain_exactly(owner.account.id, human.id)
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      members = Array.new(count) { create(:account) }
      holder[:id] = create_talk(kind: "group", owner: owner.account, members: members).id
    end

    it "does not grow queries as membership grows (F-19)" do
      expect { described_class.call(conversation_id: holder.fetch(:id)) }
        .to perform_constant_number_of_queries
    end
  end
end
