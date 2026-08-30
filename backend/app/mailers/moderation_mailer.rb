class ModerationMailer < ApplicationMailer
  def report(user:, report:, auto_flagged:)
    name = user.account.display_name
    @headline = Catalog.t("mailers.moderation.report.headline")
    @body = Catalog.t(
      "mailers.moderation.report.body",
      name: name, subject_type: report.subject_type, reason: report.reason
    )
    @footer = Catalog.t("mailers.moderation.report.footer")
    key = auto_flagged ? "subject_flagged" : "subject"
    mail(
      to: user.email,
      subject: Catalog.t("mailers.moderation.report.#{key}", id: report.id)
    )
  end
end
