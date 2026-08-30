require "rails_helper"

RSpec.describe Messages::CatchUp do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    [ user, conversation ]
  end

  it "includes tombstones so reconnecting clients learn about unsends (BR-30)" do
    user, conversation = setup
    kept = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    tombstone = Messages::Send.call(conversation: conversation, sender: user.account, body: "Gone").value
    Messages::Unsend.call(message: tombstone, actor: user.account)
    page = described_class.call(scope: conversation.messages, after: kept.revision)

    expect(page.messages.sole).to be_deleted
    expect(page.messages.sole.id).to eq(tombstone.id)
  end

  it "returns edits and new sends newer than the revision cursor (BR-33)" do
    user, conversation = setup
    created = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    edited = Messages::Send.call(conversation: conversation, sender: user.account, body: "Edit me").value
    Messages::Edit.call(message: edited, editor: user.account, body: "Edited")
    newer = Messages::Send.call(conversation: conversation, sender: user.account, body: "New").value
    page = described_class.call(scope: conversation.messages, after: created.revision)

    expect(page.messages.map(&:id)).to contain_exactly(edited.id, newer.id)
    expect(page.has_more_before).to be(false)
    expect(page.has_more_after).to be(false)
  end

  it "returns a reaction-only mutation that bumped revision (BR-26)" do
    user, conversation = setup
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    baseline = message.revision
    Messages::React.call(message: message, actor: user.account, emoji: "👍")
    page = described_class.call(scope: conversation.messages, after: baseline)

    expect(page.messages.sole.id).to eq(message.id)
    expect(page.messages.sole.reaction_summary).to eq("👍" => 1)
  end

  it "returns an empty page when nothing is newer than the cursor" do
    _user, conversation = setup
    message = create(:message, conversation: conversation, revision: 4)
    page = described_class.call(scope: conversation.messages, after: message.revision)

    expect(page.messages).to eq([])
    expect(page.oldest_position).to be_nil
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      conversation = create_direct_between(owner.account, create(:account))
      count.times do |index|
        create(:message, conversation: conversation, sender_account: owner.account, position: index + 1)
      end
      holder[:scope] = conversation.messages
    end

    it "does not grow queries as the catch-up set grows (F-4)" do
      expect do
        MessagePageResource.new(described_class.call(scope: holder.fetch(:scope), after: 0)).to_h
      end.to perform_constant_number_of_queries
    end
  end
end
