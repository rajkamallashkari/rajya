require "rails_helper"

RSpec.describe Push::DeliveryChannel do
  it "delegates to WebPush as the only implementation" do
    account = create(:user).account
    allow(Push::WebPush).to receive(:deliver).and_return(true)

    expect(described_class.current).to eq(Push::WebPush)
    expect(described_class.deliver(account: account, payload: { "title" => "Hi" })).to be(true)
    expect(Push::WebPush).to have_received(:deliver).with(account: account, payload: { "title" => "Hi" })
  end
end
