require "rails_helper"

RSpec.describe Calls::ExpireStaleJob do
  it "delegates to ExpireStale" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call
    call.update_columns(created_at: (Settings.fetch(:ring_timeout) + 1).seconds.ago)

    described_class.perform_now
    expect(call.reload.status).to eq("missed")
  end
end
