module PhoneVerifications
  Issued = Struct.new(:code, :wa_url, :expires_at, :status, :confirmed_phone, :phone_changed,
                      keyword_init: true)

  class Issue < Auth::Operation
    def call(user:)
      flagged = require_flag!(:phone_auth)
      return flagged if flagged

      user.phone_verification_requests.pending.find_each do |row|
        row.update!(expires_at: Time.current)
      end

      raw = unique_code
      request = user.phone_verification_requests.create!(
        code_digest: PhoneVerificationRequest.digest(raw),
        expires_at: Settings.fetch(:phone_verification_ttl).seconds.from_now
      )
      success(Issued.new(
        code: raw,
        wa_url: Whatsapp::DeepLink.wa_url(raw),
        expires_at: request.expires_at,
        status: "pending",
        confirmed_phone: nil,
        phone_changed: false
      ))
    end

    private

    def unique_code
      raw = Auth::Codes.generate_otp
      return raw unless pending_digest?(PhoneVerificationRequest.digest(raw))

      Auth::Codes.generate_otp
    end

    def pending_digest?(digest)
      PhoneVerificationRequest.pending.exists?(code_digest: digest)
    end
  end
end
