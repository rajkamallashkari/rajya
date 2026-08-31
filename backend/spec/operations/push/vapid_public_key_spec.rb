require "rails_helper"

RSpec.describe Push::VapidPublicKey do
  it "returns the configured public key" do
    with_vapid_env do
      expect(described_class.call.value.public_key).to eq(PushHelpers::TEST_VAPID.fetch("VAPID_PUBLIC_KEY"))
    end
  end

  it "returns a nil public key when VAPID is unset" do
    ENV.delete("VAPID_PUBLIC_KEY")
    expect(described_class.call.value.public_key).to be_nil
  end
end
