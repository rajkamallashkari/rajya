module PhoneVerifications
  class Inbound < ApplicationOperation
    def call(raw_body:, signature:)
      return failure(:unauthenticated) unless Whatsapp::Signature.valid?(raw_body, signature)

      json = parse(raw_body)
      Whatsapp::Payload.messages(json).each do |message|
        Confirm.call(sender: message.sender, body: message.body)
      end
      success(nil)
    end

    private

    def parse(raw_body)
      parsed = JSON.parse(raw_body.to_s)
      parsed.is_a?(Hash) ? parsed : {}
    rescue JSON::ParserError
      {}
    end
  end
end
