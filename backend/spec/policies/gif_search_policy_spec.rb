require "rails_helper"

RSpec.describe GifSearchPolicy do
  it "allows a human to search and denies a bot" do
    expect(described_class.new(create(:user).account, :gif_search)).to be_index
    expect(described_class.new(create(:bot).account, :gif_search)).not_to be_index
  end
end
