require "rails_helper"

RSpec.describe Ai::Cancellation do
  it "stores, reads and clears a generation cancel flag" do
    described_class.request!("gen-1")

    expect(described_class.requested?("gen-1")).to be(true)
    described_class.clear!("gen-1")
    expect(described_class.requested?("gen-1")).to be(false)
  end

  it "ignores a blank generation id" do
    expect(described_class.request!(nil)).to be_nil
    expect(described_class.requested?(nil)).to be(false)
    expect(described_class.clear!("")).to be_nil
  end
end
