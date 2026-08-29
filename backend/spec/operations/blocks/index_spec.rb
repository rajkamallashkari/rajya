require "rails_helper"

RSpec.describe Blocks::Index do
  it "wraps the scoped relation" do
    block = create(:block)
    result = described_class.call(blocks: Block.where(id: block.id))

    expect(result.value.blocks).to contain_exactly(block)
  end
end
