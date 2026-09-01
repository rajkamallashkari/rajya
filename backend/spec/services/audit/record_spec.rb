require "rails_helper"

RSpec.describe Audit::Record do
  it "persists both identities, the target, and metadata" do
    admin = create(:user, :admin)
    account = create(:account)
    event = described_class.call(admin: admin, action: "impersonation.start", impersonated_account: account,
                                 target: account, metadata: { "path" => "/x" }, ip: "127.0.0.1")

    expect(event).to have_attributes(admin_user_id: admin.id, impersonated_account_id: account.id,
                                     target_type: "Account", target_id: account.id)
    expect(event.ip_address.to_s).to eq("127.0.0.1")
  end
end
