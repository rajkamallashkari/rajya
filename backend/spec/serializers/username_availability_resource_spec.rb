require "rails_helper"

RSpec.describe UsernameAvailabilityResource do
  it "serialises available" do
    expect(described_class.new(Accounts::CheckUsername::Availability.new(available: true)).to_h)
      .to eq("available" => true)
  end
end
