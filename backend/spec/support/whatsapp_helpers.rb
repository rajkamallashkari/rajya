module WhatsappHelpers
  def configure_whatsapp!(secret: "hub-secret", token: "verify-me", number: "15551234567")
    write_setting("whatsapp_app_secret", secret)
    write_setting("whatsapp_webhook_verify_token", token)
    write_setting("whatsapp_business_number", number)
  end

  def write_setting(key, value, category: "auth")
    setting = AppSetting.find_or_initialize_by(key: key)
    setting.category = category
    setting.value = value
    setting.save!
  end

  def whatsapp_signature(body, secret: "hub-secret")
    "sha256=#{OpenSSL::HMAC.hexdigest("SHA256", secret, body)}"
  end

  def whatsapp_inbound(from:, text:)
    {
      "object" => "whatsapp_business_account",
      "entry" => [ {
        "changes" => [ {
          "value" => {
            "messages" => [ { "from" => from, "text" => { "body" => text } } ]
          }
        } ]
      } ]
    }.to_json
  end
end

RSpec.configure do |config|
  config.include WhatsappHelpers
end
