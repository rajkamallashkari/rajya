require "rails_helper"

RSpec.describe Conversations::Unmute do
  it "clears muted_until" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    duration = Array(Settings.fetch(:mute_durations)).first
    Conversations::Mute.call(account: user.account, conversation: conversation, duration: duration)
    described_class.call(account: user.account, conversation: conversation)

    expect(Conversations::View.for(conversation.reload, user.account).membership.muted_until).to be_nil
  end
end
