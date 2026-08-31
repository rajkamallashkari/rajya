require "rails_helper"

RSpec.describe Calls::IssueIceServers do
  it "returns STUN servers when TURN is unset" do
    enable_webrtc_calls!
    account = create(:user).account

    expect(described_class.call(account: account).value.ice_servers.first.fetch("urls")).to start_with("stun:")
  end

  it "rejects when the flag is off" do
    expect(described_class.call(account: create(:user).account).error_code).to eq(:not_found)
  end
end
