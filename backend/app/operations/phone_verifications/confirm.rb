module PhoneVerifications
  class Confirm < ApplicationOperation
    def call(sender:, body:)
      digest = PhoneVerificationRequest.digest(body.to_s.strip)
      request = PhoneVerificationRequest.pending.find_by(code_digest: digest)
      return success(nil) if request.nil?

      phone = Auth::Phones.normalize(sender)
      return success(nil) if phone.blank?
      return success(nil) if taken_by_other?(request.user, phone)

      user = request.user
      previous = user.phone
      User.transaction do
        request.update!(confirmed_phone: phone, confirmed_at: Time.current)
        user.update!(phone: phone, phone_verified_at: Time.current)
      end
      Whatsapp::Reply.verified(phone)
      Realtime.publish("account:#{user.account_id}", :phone_verified, { phone: phone, previous: previous })
      success(request.reload)
    end

    private

    def taken_by_other?(user, phone)
      User.where.not(id: user.id).exists?(phone: phone)
    end
  end
end
