require "rails_helper"

RSpec.describe UsernamePolicy do
  it "allows a human to check availability" do
    expect(described_class.new(create(:user).account, :username)).to be_show
    expect(described_class.new(nil, :username)).not_to be_show
  end
end
