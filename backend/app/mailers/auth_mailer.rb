class AuthMailer < ApplicationMailer
  SECONDS_PER_MINUTE = 60

  def email_otp(user:, otp:)
    assign_common(user, :otp, minutes_for(:otp_expiry), otp: otp)
    @otp = otp
    mail(to: user.email, subject: Catalog.t("mailers.auth.otp.subject", otp: otp))
  end

  def email_change(user:, new_email:, otp:)
    assign_common(user, :email_change, minutes_for(:otp_expiry), otp: otp)
    @otp = otp
    mail(to: new_email, subject: Catalog.t("mailers.auth.email_change.subject", otp: otp),
         template_name: "email_otp")
  end

  def magic_link(user:, token:)
    assign_common(user, :magic_link, minutes_for(:magic_link_ttl))
    @url = "#{frontend_origin}/auth/magic?token=#{CGI.escape(token)}"
    mail(to: user.email, subject: Catalog.t("mailers.auth.magic_link.subject"))
  end

  def password_reset(user:, token:)
    assign_common(user, :password_reset, minutes_for(:password_reset_ttl))
    @url = "#{frontend_origin}/auth/reset-password?token=#{CGI.escape(token)}"
    mail(to: user.email, subject: Catalog.t("mailers.auth.password_reset.subject"))
  end

  private

  def assign_common(user, kind, minutes, **extra)
    name = user.account.display_name
    @headline = Catalog.t("mailers.auth.#{kind}.headline")
    @body = Catalog.t("mailers.auth.#{kind}.body", name: name, minutes: minutes, **extra)
    @footer = Catalog.t("mailers.auth.#{kind}.footer")
  end

  def minutes_for(key)
    Settings.fetch(key) / SECONDS_PER_MINUTE
  end

  def frontend_origin
    CorsOrigins.frontend_origin
  end
end
