require "rails_helper"

RSpec.describe Auth::Passwords::Verify do
  it "succeeds for the correct password" do
    user = create(:user, :with_password)

    expect(described_class.call(user: user, password: "password12")).to be_success
  end

  it "returns unauthenticated for a wrong password" do
    user = create(:user, :with_password)

    expect(described_class.call(user: user, password: "nope").error_code).to eq(:unauthenticated)
  end

  it "returns unauthenticated when the user has no password" do
    user = create(:user, password_digest: nil)

    expect(described_class.call(user: user, password: "password12").error_code).to eq(:unauthenticated)
  end
end
