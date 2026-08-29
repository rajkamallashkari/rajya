require "rails_helper"

RSpec.describe Admin::UserPolicy do
  it "allows an admin and forbids a regular user" do
    target = create(:user)
    expect(described_class.new(create(:user, :admin), target)).to be_verify_phone
    expect(described_class.new(create(:user), target)).not_to be_verify_phone
  end
end
