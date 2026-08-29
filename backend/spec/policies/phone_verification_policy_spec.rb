require "rails_helper"

RSpec.describe PhoneVerificationPolicy do
  it "allows a human and forbids a bot" do
    expect(described_class.new(create(:user).account, PhoneVerificationRequest)).to be_create
    expect(described_class.new(create(:user).account, PhoneVerificationRequest)).to be_show
    expect(described_class.new(create(:account, :bot_kind), PhoneVerificationRequest)).not_to be_create
  end
end
