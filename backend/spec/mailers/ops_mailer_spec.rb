require "rails_helper"

RSpec.describe OpsMailer do
  it "notifies an admin of a capacity alert" do
    admin = create(:user, :admin, email: "ops@example.com")
    alert = Monitoring::AlertCapacity::Alert.new(
      kind: "disk", id: "/", percent: 90,
      message: Catalog.t("mailers.ops.capacity.disk", path: "/", percent: 90)
    )

    mail = described_class.capacity_alert(user: admin, alert: alert)

    expect(mail.to).to eq([ "ops@example.com" ])
    expect(mail.subject).to eq(Catalog.t("mailers.ops.capacity.subject", percent: 90))
    expect(mail.body.encoded).to include("/")
  end
end
