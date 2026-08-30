require "rails_helper"

RSpec.describe Messages::BulkUnsend do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    one = Messages::Send.call(conversation: conversation, sender: user.account, body: "A").value
    two = Messages::Send.call(conversation: conversation, sender: user.account, body: "B").value
    [ user, conversation, one, two ]
  end

  it "tombstones every selected message and never hard-deletes (BR-1, NR-20)" do
    user, _conversation, one, two = setup
    result = described_class.call(actor: user.account, message_ids: [ one.id, two.id ])

    expect(result.value.messages.map(&:deleted?)).to eq([ true, true ])
    expect(Message.where(id: [ one.id, two.id ]).count).to eq(2)
  end

  it "rejects the whole batch when any item is unauthorized" do
    user, conversation, one, _two = setup
    peer = conversation.conversation_memberships.where.not(account: user.account).sole.account
    other = Messages::Send.call(conversation: conversation, sender: peer, body: "C").value
    result = described_class.call(actor: user.account, message_ids: [ one.id, other.id ])

    expect(result.error_code).to eq(:forbidden)
    expect(one.reload).not_to be_deleted
    expect(other.reload).not_to be_deleted
  end

  it "rejects an empty list, a missing id, and an already-deleted row" do
    user, _conversation, one, two = setup
    Messages::Unsend.call(message: two, actor: user.account)

    expect(described_class.call(actor: user.account, message_ids: []).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: user.account, message_ids: [ 0 ]).error_code).to eq(:not_found)
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ]).error_code).to eq(:conflict)
  end

  it "rejects a batch over the multi-select cap" do
    user, _conversation, one, _two = setup
    stub_setting(:multi_select_cap, 1)
    expect(described_class.call(actor: user.account, message_ids: [ one.id, one.id + 1 ]).error_code)
      .to eq(:validation_failed)
  end

  it "rejects a row outside the unsend window" do
    user, _conversation, one, _two = setup
    one.update_columns(created_at: 1.day.ago)
    stub_setting(:unsend_window, 60)
    expect(described_class.call(actor: user.account, message_ids: [ one.id ]).error_code).to eq(:forbidden)
    expect(one.reload).not_to be_deleted
  end
end
