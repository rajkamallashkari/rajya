require "rails_helper"

RSpec.describe Search::Tsquery do
  it "builds a prefix tsquery and ignores punctuation-only input" do
    expect(described_class.call("Hello World!")).to eq("hello:* & world:*")
    expect(described_class.call("???")).to be_nil
  end
end
