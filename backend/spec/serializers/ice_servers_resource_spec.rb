require "rails_helper"

RSpec.describe IceServersResource do
  it "wraps the ice server list" do
    json = described_class.new(Calls::IceConfig.new(ice_servers: [ { "urls" => "stun:x" } ])).to_h

    expect(json.fetch("ice_servers").first.fetch("urls")).to eq("stun:x")
  end
end
