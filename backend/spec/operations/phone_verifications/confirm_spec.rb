require "rails_helper"

RSpec.describe PhoneVerifications::Confirm do
  it "stamps the sender number and treats it as ground truth" do
    user = create(:user, phone: "15550000000")
    raw = "123456"
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest(raw),
                                        expires_at: 1.hour.from_now)
    write_setting("whatsapp_cloud_token", "tok")

    result = described_class.call(sender: "+1 (555) 999-0000", body: " 123456 ")
    expect(result).to be_success
    expect(user.reload.phone).to eq("15559990000")
    expect(user.phone_verified_at).to be_present
    expect(result.value.confirmed_phone).to eq("15559990000")
  end

  it "does not stamp an expired or unknown code" do
    user = create(:user)
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest("123456"),
                                        expires_at: 1.minute.ago)
    expect(described_class.call(sender: "1555", body: "123456").value).to be_nil
    expect(user.reload.phone).to be_nil
    expect(described_class.call(sender: "1555", body: "000000").value).to be_nil
  end

  it "ignores a blank sender and a number already on another account" do
    owner = create(:user, phone: "15551111111")
    user = create(:user)
    raw = "123456"
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest(raw),
                                        expires_at: 1.hour.from_now)

    expect(described_class.call(sender: "abc", body: raw).value).to be_nil
    expect(described_class.call(sender: owner.phone, body: raw).value).to be_nil
    expect(user.reload.phone).to be_nil
  end
end
