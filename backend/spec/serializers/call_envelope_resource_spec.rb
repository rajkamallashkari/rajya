require "rails_helper"

RSpec.describe CallEnvelopeResource do
  it "renders a nil call and optional ice servers" do
    json = described_class.new(Calls::Envelope.new(call: nil, ice_servers: [ { "urls" => "stun:x" } ])).to_h

    expect(json.fetch("call")).to be_nil
    expect(json.fetch("ice_servers").first.fetch("urls")).to eq("stun:x")
  end

  it "renders a call payload" do
    call = create(:call)
    json = described_class.new(Calls::Envelope.new(call: call, ice_servers: nil)).to_h

    expect(json.fetch("call").fetch("id")).to eq(call.id)
    expect(json.fetch("ice_servers")).to be_nil
  end
end
