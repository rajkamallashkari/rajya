require "rails_helper"

RSpec.describe SearchPolicy do
  it "allows a human to search and denies a bot" do
    expect(described_class.new(create(:user).account, :search)).to be_index
    expect(described_class.new(create(:bot).account, :search)).not_to be_index
  end
end
