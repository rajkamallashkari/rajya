require "rails_helper"

RSpec.describe Messages::BulkForward do
  def setup
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    target = create_direct_between(user.account, create(:account))
    one = Messages::Send.call(conversation: source, sender: user.account, body: "A").value
    two = Messages::Send.call(conversation: source, sender: user.account, body: "B").value
    [ user, one, two, target ]
  end

  it "forwards every selected message into one target (BR-14, NR-20)" do
    user, one, two, target = setup
    result = described_class.call(actor: user.account, message_ids: [ one.id, two.id ], target: target)

    expect(result.value.messages.map(&:body)).to eq(%w[A B])
    expect(result.value.messages.map(&:conversation_id).uniq).to eq([ target.id ])
    expect(one.reload.forward_count).to eq(1)
  end

  it "rejects the whole batch when any source is deleted" do
    user, one, two, target = setup
    Messages::Unsend.call(message: two, actor: user.account)
    result = described_class.call(actor: user.account, message_ids: [ one.id, two.id ], target: target)

    expect(result.error_code).to eq(:not_found)
    expect(target.messages).to be_empty
  end

  it "rejects an empty list and a target the actor cannot post to" do
    user, one, _two, _target = setup
    channel = create_talk(kind: "channel", owner: create(:user).account, members: [ user.account ])

    expect(described_class.call(actor: user.account, message_ids: [], target: channel).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(actor: user.account, message_ids: [ one.id ], target: channel).error_code)
      .to eq(:forbidden)
  end

  it "rejects a missing source id" do
    user, one, _two, target = setup
    expect(described_class.call(actor: user.account, message_ids: [ one.id, 0 ], target: target).error_code)
      .to eq(:not_found)
  end

  it "rejects a batch over the multi-select cap" do
    user, one, two, target = setup
    stub_setting(:multi_select_cap, 1)
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ], target: target).error_code)
      .to eq(:validation_failed)
  end

  it "rejects the whole batch when forward is forbidden" do
    user, one, two, target = setup
    # rubocop:disable RSpec/AnyInstance -- same deny pattern as request 403 specs
    allow_any_instance_of(MessagePolicy).to receive(:forward?).and_return(false)
    # rubocop:enable RSpec/AnyInstance
    expect(described_class.call(actor: user.account, message_ids: [ one.id, two.id ], target: target).error_code)
      .to eq(:forbidden)
    expect(target.messages).to be_empty
  end
end
