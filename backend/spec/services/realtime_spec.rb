require "rails_helper"

RSpec.describe Realtime do
  it "accepts a publish call as a no-op seam for P4.1" do
    expect(described_class.publish("account:1", :phone_verified, { phone: "1" })).to be_nil
  end
end
