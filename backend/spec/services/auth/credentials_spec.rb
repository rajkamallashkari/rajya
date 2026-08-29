require "rails_helper"

RSpec.describe Auth::Credentials do
  it "keeps password as a method when removing email (S-10)" do
    user = create(:user, :with_password)

    expect(described_class.remaining_after(user, removing: :email)).to eq([ :password ])
  end

  it "keeps a passkey as a method when removing email — the CHECK-blind case (S-10)" do
    user = create(:user, email: "ada@example.com", password_digest: nil)
    create(:passkey, user: user)

    expect(described_class.remaining_after(user, removing: :email)).to eq([ :passkey ])
  end

  it "keeps Google as a method when removing email" do
    user = create(:user, :google, password_digest: nil)

    expect(described_class.remaining_after(user, removing: :email)).to eq([ :google ])
  end

  it "drops passkey from the leftover set when the last passkey is removed" do
    user = create(:user, :with_password)
    passkey = create(:passkey, user: user)

    leftover = described_class.remaining_after(user, removing: :passkey, passkey: passkey)
    expect(leftover).to eq([ :email, :password ])
  end
end
