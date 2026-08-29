require "rails_helper"

RSpec.describe Auth::Google::SignIn do
  def profile(info)
    Auth::Google::Client::Profile.new(ok?: true, info: info)
  end

  def stub_profile(info)
    allow(Auth::Google::Client).to receive(:profile_from_code).and_return(profile(info))
  end

  it "rejects a blank code" do
    expect(described_class.call(code: " ").error_code).to eq(:validation_failed)
  end

  it "maps Google failures to upstream_failed" do
    allow(Auth::Google::Client).to receive(:profile_from_code).and_return(
      Auth::Google::Client::Profile.new(ok?: false, info: nil)
    )

    expect(described_class.call(code: "x").error_code).to eq(:upstream_failed)
  end

  it "creates a human account from a new Google subject" do
    stub_profile("sub" => "g1", "email" => "ada@example.com", "name" => "Ada", "email_verified" => true)
    result = described_class.call(code: "ok")

    expect(result).to be_success
    expect(result.value.user.google_subject).to eq("g1")
    expect(result.value.user.email_verified_at).to be_present
  end

  it "uses the email local-part when Google omits a name" do
    stub_profile("sub" => "g2", "email" => "no-name@example.com")
    result = described_class.call(code: "ok")

    expect(result.value.account.display_name).to eq("no-name")
  end

  it "refreshes email on a returning Google subject" do
    user = create(:user, :google, google_subject: "g3", email: "old@example.com")
    stub_profile("sub" => "g3", "email" => "new@example.com", "email_verified" => "true")
    result = described_class.call(code: "ok")

    expect(result.value.user).to eq(user)
    expect(user.reload.email).to eq("new@example.com")
    expect(user.email_verified_at).to be_present
  end

  it "does not overwrite email_verified_at when it is already set" do
    stamped = 1.day.ago.change(usec: 0)
    user = create(:user, :google, google_subject: "g4", email_verified_at: stamped)
    stub_profile("sub" => "g4", "email" => user.email, "email_verified" => true)
    described_class.call(code: "ok")

    expect(user.reload.email_verified_at).to eq(stamped)
  end

  it "skips the update when Google sends no email and the row is already verified" do
    user = create(:user, :google, google_subject: "g5", email_verified_at: Time.current)
    stub_profile("sub" => "g5")
    result = described_class.call(code: "ok")

    expect(result).to be_success
    expect(result.value.user).to eq(user)
  end

  it "rejects a new Google user whose email is already taken" do
    create(:user, email: "taken@example.com")
    stub_profile("sub" => "g6", "email" => "taken@example.com")

    expect(described_class.call(code: "ok").error_code).to eq(:conflict)
  end

  it "rejects a deactivated returning user" do
    user = create(:user, :google, google_subject: "g8")
    user.account.update!(deactivated_at: Time.current)
    stub_profile("sub" => "g8", "email" => user.email)

    expect(described_class.call(code: "ok").error_code).to eq(:unauthenticated)
  end

  it "rejects a new Google user with no email" do
    stub_profile("sub" => "g7")

    expect(described_class.call(code: "ok").error_code).to eq(:validation_failed)
  end
end
