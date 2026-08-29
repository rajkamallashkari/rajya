module Whatsapp
  class VerifySubscription < ApplicationOperation
    def call(mode:, token:, challenge:)
      expected = Settings.fetch(:whatsapp_webhook_verify_token).to_s
      return failure(:forbidden) if expected.blank?
      return failure(:forbidden) unless mode.to_s == "subscribe"
      return failure(:forbidden) unless ActiveSupport::SecurityUtils.secure_compare(expected, token.to_s)

      success(challenge.to_s)
    end
  end
end
