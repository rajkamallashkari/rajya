require "rails_helper"

RSpec.describe Blocks::Destroy do
  it "destroys the block" do
    block = create(:block)
    expect(described_class.call(block: block)).to be_success
    expect(Block.find_by(id: block.id)).to be_nil
  end
end
