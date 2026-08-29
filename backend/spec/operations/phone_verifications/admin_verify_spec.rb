require "rails_helper"

RSpec.describe PhoneVerifications::AdminVerify do
  it "stamps the phone and writes an audit event" do
    admin = create(:user, :admin)
    user = create(:user)
    result = described_class.call(admin: admin, user: user, phone: "+1 555 000 1111", ip: "127.0.0.1")

    expect(result).to be_success
    expect(user.reload.phone).to eq("15550001111")
    expect(user.phone_verified_at).to be_present
    expect(AuditEvent.last).to have_attributes(action: "phone.verified", admin_user: admin)
  end

  it "rejects a non-admin, a blank number, and a taken number" do
    user = create(:user)
    expect(described_class.call(admin: create(:user), user: user, phone: "1555").error_code).to eq(:forbidden)
    expect(described_class.call(admin: create(:user, :admin), user: user, phone: " ").error_code).to eq(:validation_failed)
    create(:user, phone: "15551111111")
    expect(described_class.call(admin: create(:user, :admin), user: user,
                                phone: "15551111111").error_code).to eq(:conflict)
  end
end
