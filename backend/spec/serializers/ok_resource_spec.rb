require "rails_helper"

RSpec.describe OkResource do
  it "always serialises ok: true" do
    expect(described_class.new(true).to_h).to eq("ok" => true)
  end
end
