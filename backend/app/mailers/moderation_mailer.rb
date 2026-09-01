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

  def warning(user:, report:)
    name = user.account.display_name
    @headline = Catalog.t("mailers.moderation.warning.headline")
    @body = Catalog.t("mailers.moderation.warning.body", name: name, reason: report.reason)
    @footer = Catalog.t("mailers.moderation.warning.footer")
    mail(to: user.email, subject: Catalog.t("mailers.moderation.warning.subject"))
  end
end
