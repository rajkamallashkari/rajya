require "rails_helper"

RSpec.describe GenerationResource do
  it "exposes the generation id" do
    expect(described_class.new({ generation_id: "1:2:3" }).to_h).to eq("generation_id" => "1:2:3")
  end
end
