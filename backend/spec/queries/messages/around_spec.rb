require "rails_helper"

RSpec.describe Messages::Around do
  def seed(conversation, sender, positions)
    positions.map do |position|
      create(:message, conversation: conversation, sender_account: sender, position: position, body: "m#{position}")
    end
  end

  it "returns a window centred on the pivot and reports remaining edges" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    rows = seed(conversation, user.account, [ 1, 2, 3, 4, 5 ])
    AppSetting.create!(key: "jump_window", value: 3, category: "messaging")
    page = described_class.call(scope: conversation.messages, pivot: rows[2])

    expect(page.messages.map(&:position)).to eq([ 2, 3, 4 ])
    expect(page.pivot_id).to eq(rows[2].id)
    expect(page.has_more_before).to be(true)
    expect(page.has_more_after).to be(true)
  end

  it "fills from one side when the pivot is at an edge" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    rows = seed(conversation, user.account, [ 1, 2, 3 ])
    AppSetting.create!(key: "jump_window", value: 3, category: "messaging")
    page = described_class.call(scope: conversation.messages, pivot: rows.first)

    expect(page.messages.map(&:position)).to eq([ 1, 2, 3 ])
    expect(page.has_more_before).to be(false)
    expect(page.has_more_after).to be(false)
  end
end
