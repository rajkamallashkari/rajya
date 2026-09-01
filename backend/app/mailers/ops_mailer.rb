class OpsMailer < ApplicationMailer
  def capacity_alert(user:, alert:)
    @headline = Catalog.t("mailers.ops.capacity.headline")
    @body = alert.message
    @footer = Catalog.t("mailers.ops.capacity.footer")
    mail(
      to: user.email,
      subject: Catalog.t("mailers.ops.capacity.subject", percent: alert.percent)
    )
  end
end
