require "rails_helper"

RSpec.describe WebauthnOptionsResource do
  it "forwards the ceremony payload including nonce" do
    json = described_class.new({ challenge: "abc", nonce: "n1", allowCredentials: [] }).to_h

    expect(json).to eq("challenge" => "abc", "nonce" => "n1", "allowCredentials" => [])
  end
end
