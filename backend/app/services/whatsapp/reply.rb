# Free-form reply inside the customer-service window. No-ops when the Cloud
# token is unset so local/dev and tests do not need Meta credentials.
module Whatsapp
  class Reply
    def self.verified(to)
      token = Settings.fetch(:whatsapp_cloud_token).to_s
      return if token.blank? || to.blank?

      Catalog.t("whatsapp.verified")
    end
  end
end
