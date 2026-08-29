module Webhooks
  class WhatsappController < ApplicationController
    def verify
      result = Whatsapp::VerifySubscription.call(
        mode: hub_param(:mode), token: hub_param(:verify_token), challenge: hub_param(:challenge)
      )
      if result.success?
        render plain: result.value, status: :ok
      else
        render_error(result.error_code)
      end
    end

    def create
      result = PhoneVerifications::Inbound.call(
        raw_body: request.raw_post, signature: request.headers[Whatsapp::Signature::HEADER]
      )
      if result.success?
        render json: OkResource.new(true).to_h, status: :ok
      else
        render_error(result.error_code)
      end
    end

    private

    def skip_authentication?
      true
    end

    def skip_authorization?
      true
    end

    def hub_param(key)
      params[:"hub.#{key}"] || params.dig(:hub, key)
    end
  end
end
