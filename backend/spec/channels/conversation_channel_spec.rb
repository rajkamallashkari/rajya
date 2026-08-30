require "rails_helper"

RSpec.describe ConversationChannel, type: :channel do
  let(:user) { create(:user) }

  before { stub_connection current_user: user, current_account: user.account }

  it "subscribes an active member to the conversation stream" do
    conversation = create_direct_between(user.account, create(:account))
    subscribe conversation_id: conversation.id

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from(Realtime.conversation_stream(conversation.id))
  end

  it "rejects a non-member" do
    conversation = create_direct_between(create(:account), create(:account))
    subscribe conversation_id: conversation.id

    expect(subscription).to be_rejected
  end

  it "rejects a missing conversation" do
    subscribe conversation_id: 0

    expect(subscription).to be_rejected
  end
end
