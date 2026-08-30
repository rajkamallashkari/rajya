require "rails_helper"

RSpec.describe Messages::Page do
  def seed(conversation, sender, positions)
    positions.map do |position|
      create(:message, conversation: conversation, sender_account: sender, position: position, body: "m#{position}")
    end
  end

  def override_page_size(value)
    AppSetting.create!(key: "message_page_size", value: value, category: "messaging")
  end

  it "returns the latest page in position order and keeps tombstones (BR-30, BR-108)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    seed(conversation, user.account, [ 1, 2, 3 ])
    Messages::Unsend.call(message: conversation.messages.find_by!(position: 2), actor: user.account)
    override_page_size(2)
    page = described_class.call(scope: conversation.messages)

    expect(page.messages.map(&:position)).to eq([ 2, 3 ])
    expect(page.messages.first).to be_deleted
    expect(page.has_more_before).to be(true)
    expect(page.has_more_after).to be(false)
  end

  it "pages older with before and newer with after" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    seed(conversation, user.account, [ 1, 2, 3 ])
    override_page_size(1)
    older = described_class.call(scope: conversation.messages, before: 3)
    newer = described_class.call(scope: conversation.messages, after: 1)

    expect(older.messages.map(&:position)).to eq([ 2 ])
    expect(older.has_more_before).to be(true)
    expect(newer.messages.map(&:position)).to eq([ 2 ])
    expect(newer.has_more_after).to be(true)
  end

  it "returns an empty page for an empty conversation" do
    conversation = create_direct_between(create(:account), create(:account))
    page = described_class.call(scope: conversation.messages)

    expect(page.messages).to eq([])
    expect(page.has_more_before).to be(false)
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

    it "does not grow queries as the page grows (F-4)" do
      Settings.fetch(:message_page_size)
      expect do
        MessagePageResource.new(described_class.call(scope: holder.fetch(:scope))).to_h
      end.to perform_constant_number_of_queries
    end
  end
end
