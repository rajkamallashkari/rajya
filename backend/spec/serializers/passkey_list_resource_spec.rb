require "rails_helper"

RSpec.describe PasskeyListResource do
  it "wraps passkeys in a passkeys array" do
    passkey = create(:passkey, nickname: "Laptop")
    json = described_class.new(Auth::Passkeys::Index::Payload.new(passkeys: [ passkey ])).to_h

    expect(json.fetch("passkeys").sole.fetch("id")).to eq(passkey.id)
  end
end
