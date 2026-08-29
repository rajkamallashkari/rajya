require "rails_helper"

RSpec.describe Auth::Phones do
  it "strips non-digits and returns nil when empty" do
    expect(described_class.normalize("+1 (555) 000-1111")).to eq("15550001111")
    expect(described_class.normalize("  ")).to be_nil
  end
end
