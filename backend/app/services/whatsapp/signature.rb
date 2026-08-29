# Meta signed webhook bodies (X-Hub-Signature-256). Fail closed when the app
# secret is blank so an unconfigured environment cannot accept forged inbound
# messages (TARGET §4.8).
module Whatsapp
  class Signature
    PREFIX = "sha256="
    HEADER = "X-Hub-Signature-256"
    DIGEST = "SHA256"

    def self.valid?(raw_body, header)
      secret = Settings.fetch(:whatsapp_app_secret).to_s
      return false if secret.blank? || header.blank?

      given = header.to_s.delete_prefix(PREFIX)
      expected = OpenSSL::HMAC.hexdigest(DIGEST, secret, raw_body.to_s)
      ActiveSupport::SecurityUtils.secure_compare(expected, given)
    end
  end
end
