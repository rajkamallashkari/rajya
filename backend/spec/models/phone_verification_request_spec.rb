require "rails_helper"

RSpec.describe PhoneVerificationRequest do
  it "digests a code with SHA-256" do
    expect(described_class.digest("123456")).to eq(Digest::SHA256.hexdigest("123456"))
  end

  it "treats unconfirmed unexpired rows as pending" do
    request = create(:phone_verification_request, expires_at: 1.minute.from_now)

    expect(request).to be_pending
    expect(request).not_to be_expired
    expect(request).not_to be_confirmed
    expect(described_class.pending).to include(request)
  end

  it "treats past expires_at as expired" do
    request = create(:phone_verification_request, expires_at: 1.minute.ago)

    expect(request).to be_expired
    expect(request).not_to be_pending
    expect(described_class.pending).not_to include(request)
  end

  it "treats a stamped confirmation as confirmed" do
    request = create(:phone_verification_request, confirmed_at: Time.current, confirmed_phone: "1555")

    expect(request).to be_confirmed
    expect(request).not_to be_pending
  end
end
