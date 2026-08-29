require "rails_helper"

RSpec.describe BlockListResource do
  it "nests blocked accounts" do
    block = create(:block)
    json = described_class.new(Blocks::List.new(blocks: [ block ])).to_h

    expect(json.fetch("blocks").first.fetch("account").fetch("id")).to eq(block.blocked_account_id)
  end
end
