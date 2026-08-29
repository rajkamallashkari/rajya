require "rails_helper"

RSpec.describe Auth::Emails do
  it "strips and downcases" do
    expect(described_class.normalize("  A@Example.COM ")).to eq("a@example.com")
  end

  it "returns nil for blank input" do
    expect(described_class.normalize("  ")).to be_nil
  end
end
