module PhoneVerifications
  class Show < Auth::Operation
    def call(user:)
      flagged = require_flag!(:phone_auth)
      return flagged if flagged

      request = user.phone_verification_requests.order(created_at: :desc).first
      if request.nil?
        return success(Issued.new(code: nil, wa_url: nil, expires_at: nil, status: "none",
                                  confirmed_phone: user.phone, phone_changed: false))
      end

      success(Issued.new(
        code: nil,
        wa_url: nil,
        expires_at: request.expires_at,
        status: status_for(request),
        confirmed_phone: request.confirmed_phone.presence || user.phone,
        phone_changed: false
      ))
    end

    private

    def status_for(request)
      return "confirmed" if request.confirmed?
      return "expired" if request.expired?

      "pending"
    end
  end
end
