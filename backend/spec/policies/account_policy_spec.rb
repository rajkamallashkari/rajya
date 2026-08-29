require "rails_helper"

RSpec.describe AccountPolicy do
  it "allows a human to view a profile" do
    expect(described_class.new(create(:user).account, Account)).to be_show
    expect(described_class.new(create(:account, :bot_kind), Account)).not_to be_show
  end
end
