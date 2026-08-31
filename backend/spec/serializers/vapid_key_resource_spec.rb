require "rails_helper"

RSpec.describe VapidKeyResource do
  it "serialises a nullable public key" do
    key = Push::VapidPublicKey::Key.new(public_key: "abc")
    expect(described_class.new(key).to_h).to eq("public_key" => "abc")
  end
end
