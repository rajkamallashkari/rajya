require "rails_helper"

RSpec.describe Auth::RemoveCredential do
  it "removes email when a password remains (S-10)" do
    user = create(:user, :with_password)
    result = described_class.call(user: user, kind: :email)

    expect(result).to be_success
    expect(user.reload.email).to be_nil
  end

  it "removes email when only a passkey remains — a table CHECK would have missed this (S-10)" do
    user = create(:user, email: "ada@example.com", password_digest: nil)
    create(:passkey, user: user)
    result = described_class.call(user: user, kind: :email)

    expect(result).to be_success
    expect(user.reload.email).to be_nil
  end

  it "removes email when only Google remains" do
    user = create(:user, :google, password_digest: nil)
    result = described_class.call(user: user, kind: :email)

    expect(result).to be_success
    expect(user.reload.google_subject).to be_present
    expect(user.email).to be_nil
  end

  it "rejects removing the last login method (F-8)" do
    user = create(:user, password_digest: nil)
    result = described_class.call(user: user, kind: :email)

    expect(result.error_code).to eq(:conflict)
    expect(user.reload.email).to be_present
  end

  it "rejects removing the last passkey (F-8)" do
    user = create(:user, email: nil, password_digest: nil)
    passkey = create(:passkey, user: user)
    result = described_class.call(user: user, kind: :passkey, passkey: passkey)

    expect(result.error_code).to eq(:conflict)
    expect(Passkey.exists?(passkey.id)).to be(true)
  end

  it "rejects removing Google when it is the only method" do
    user = create(:user, :google, email: nil, password_digest: nil)
    result = described_class.call(user: user, kind: :google)

    expect(result.error_code).to eq(:conflict)
  end

  it "rejects removing password when it is the only remaining method besides a blank email" do
    user = create(:user, :with_password, email: nil)
    result = described_class.call(user: user, kind: :password)

    expect(result.error_code).to eq(:conflict)
  end

  it "destroys a passkey when another method remains" do
    user = create(:user, :with_password)
    passkey = create(:passkey, user: user)
    result = described_class.call(user: user, kind: :passkey, passkey: passkey)

    expect(result).to be_success
    expect(Passkey.exists?(passkey.id)).to be(false)
  end

  it "returns not_found for a passkey that belongs to someone else" do
    user = create(:user, :with_password)
    other = create(:passkey)
    result = described_class.call(user: user, kind: :passkey, passkey: other)

    expect(result.error_code).to eq(:not_found)
  end

  it "returns not_found when removing a passkey without a record" do
    user = create(:user, :with_password)
    expect(described_class.call(user: user, kind: :passkey).error_code).to eq(:not_found)
  end

  it "returns validation_failed for an unknown kind" do
    user = create(:user, :with_password)
    expect(described_class.call(user: user, kind: :phone).error_code).to eq(:validation_failed)
  end

  it "clears google_subject when another method remains" do
    user = create(:user, :google, :with_password)
    result = described_class.call(user: user, kind: :google)

    expect(result).to be_success
    expect(user.reload.google_subject).to be_nil
  end

  it "clears password_digest when another method remains" do
    user = create(:user, :with_password, :google)
    result = described_class.call(user: user, kind: :password)

    expect(result).to be_success
    expect(user.reload.password_digest).to be_nil
  end
end
