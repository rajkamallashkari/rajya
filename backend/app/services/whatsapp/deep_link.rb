# wa.me URL with the verification code prefilled (TARGET §4.8). Blank business
# number yields no link — the admin fallback is the path that still works.
module Whatsapp
  class DeepLink
    def self.wa_url(code)
      number = Auth::Phones.normalize(Settings.fetch(:whatsapp_business_number))
      return if number.blank? || code.blank?

      "https://wa.me/#{number}?text=#{CGI.escape(code)}"
    end
  end
end
