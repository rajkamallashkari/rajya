require "rails_helper"

RSpec.describe Calls::Show do
  it "returns the envelope for a participant and rejects others" do
    enable_webrtc_calls!
    initiator = create(:user)
    callee = create(:user)
    conversation = create_direct_between(initiator.account, callee.account)
    call = Calls::Create.call(account: initiator.account, conversation: conversation, kind: "audio").value.call

    expect(described_class.call(account: initiator.account, call: call).value.call).to eq(call)
    expect(described_class.call(account: create(:user).account, call: call).error_code).to eq(:forbidden)
    FeatureFlag.find_by!(key: "webrtc_calls").update!(enabled: false)
    expect(described_class.call(account: initiator.account, call: call).error_code).to eq(:not_found)
  end
end
