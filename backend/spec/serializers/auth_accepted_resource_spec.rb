require "rails_helper"

RSpec.describe AuthAcceptedResource do
  it "serialises the enumeration-safe accepted flag" do
    json = described_class.new(Auth::Accepted.new(true)).to_h

    expect(json).to eq("accepted" => true)
  end
end
