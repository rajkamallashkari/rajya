require "rails_helper"

RSpec.describe Users::CompleteOnboarding do
  it "stamps onboarded_at once" do
    user = create(:user)
    first = described_class.call(user: user)
    stamped = user.reload.onboarded_at
    second = described_class.call(user: user.reload)

    expect(first).to be_success
    expect(stamped).to be_present
    expect(second).to be_success
    expect(user.reload.onboarded_at).to eq(stamped)
  end
end
