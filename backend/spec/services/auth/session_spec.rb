require "rails_helper"

RSpec.describe Auth::Session do
  it "encodes a JWT for the human and participant" do
    user = create(:user)
    payload = described_class.issue(user)

    expect(payload.user).to eq(user)
    expect(payload.account).to eq(user.account)
    expect(Auth::Token.decode(payload.token)["sub"]).to eq(user.id)
  end
end
