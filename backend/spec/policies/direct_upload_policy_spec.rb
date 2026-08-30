require "rails_helper"

RSpec.describe DirectUploadPolicy do
  it "allows a human to presign and denies a bot" do
    expect(described_class.new(create(:user).account, :direct_upload)).to be_create
    expect(described_class.new(create(:bot).account, :direct_upload)).not_to be_create
  end
end
