require "rails_helper"

RSpec.describe Messages::BulkSave do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    one = Messages::Send.call(conversation: conversation, sender: user.account, body: "A").value
    two = Messages::Send.call(conversation: conversation, sender: user.account, body: "B").value
    [ user, one, two ]
  end

  it "saves every selected message" do
    user, one, two = setup
    result = described_class.call(actor: user.account, message_ids: [ one.id, two.id ])

    expect(result.value.saved_messages.map(&:message_id)).to eq([ one.id, two.id ])
  end

  it "rejects the whole batch when any message is missing or unsend" do
    user, one, two = setup
    Messages::Unsend.call(message: two, actor: user.account)

    expect(described_class.call(actor: user.account, message_ids: []).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: user.account, message_ids: [ 0 ]).error_code).to eq(:not_found)
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ]).error_code).to eq(:not_found)
    expect(SavedMessage.where(account: user.account).count).to eq(0)
  end

  it "rejects a batch over the multi-select cap" do
    user, one, two = setup
    stub_setting(:multi_select_cap, 1)
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ]).error_code)
      .to eq(:validation_failed)
  end

  it "rejects the whole batch when save is forbidden" do
    user, one, two = setup
    # rubocop:disable RSpec/AnyInstance -- same deny pattern as request 403 specs
    allow_any_instance_of(MessagePolicy).to receive(:save?).and_return(false)
    # rubocop:enable RSpec/AnyInstance
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ]).error_code)
      .to eq(:forbidden)
    expect(SavedMessage.where(account: user.account).count).to eq(0)
  end
end
