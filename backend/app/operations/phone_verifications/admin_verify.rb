module PhoneVerifications
  class AdminVerify < ApplicationOperation
    def call(admin:, user:, phone:, ip: nil)
      return failure(:forbidden) unless admin.is_admin?

      number = Auth::Phones.normalize(phone)
      return phone_blank if number.blank?
      return phone_taken if User.where.not(id: user.id).exists?(phone: number)

      user.update!(phone: number, phone_verified_at: Time.current)
      AuditEvent.create!(
        admin_user: admin,
        action: "phone.verified",
        target_type: "User",
        target_id: user.id,
        metadata: { "phone" => number },
        ip_address: ip
      )
      success(Users::Me.new(account: user.account, user: user.reload))
    end

    private

    def phone_blank
      failure(:validation_failed, details: { phone: [ Catalog.t("errors.models.user.phone_blank") ] })
    end

    def phone_taken
      failure(:conflict, details: { phone: [ Catalog.t("errors.models.user.phone_taken") ] })
    end
  end
end
