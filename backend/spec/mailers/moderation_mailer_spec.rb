require "rails_helper"

RSpec.describe ModerationMailer do
  it "notifies an admin of a new report" do
    admin = create(:user, :admin, email: "mod@example.com")
    report = create(:report)

    mail = described_class.report(user: admin, report: report, auto_flagged: false)

    expect(mail.to).to eq([ "mod@example.com" ])
    expect(mail.subject).to eq(Catalog.t("mailers.moderation.report.subject", id: report.id))
    expect(mail.body.encoded).to include(report.reason)
  end

  it "uses the flagged subject when the threshold is reached" do
    admin = create(:user, :admin, email: "mod@example.com")
    report = create(:report)

    mail = described_class.report(user: admin, report: report, auto_flagged: true)

    expect(mail.subject).to eq(Catalog.t("mailers.moderation.report.subject_flagged", id: report.id))
  end

  it "warns the reported account" do
    user = create(:user, email: "target@example.com")
    report = create(:report)

    mail = described_class.warning(user: user, report: report)

    expect(mail.to).to eq([ "target@example.com" ])
    expect(mail.subject).to eq(Catalog.t("mailers.moderation.warning.subject"))
    expect(mail.body.encoded).to include(report.reason)
  end
end
