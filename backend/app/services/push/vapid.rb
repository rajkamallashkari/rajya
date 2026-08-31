module Push
  module Vapid
    module_function

    def configured?
      public_key.present? && private_key.present?
    end

    def public_key
      ENV["VAPID_PUBLIC_KEY"].presence
    end

    def private_key
      ENV["VAPID_PRIVATE_KEY"].presence
    end

    def subject
      ENV["VAPID_SUBJECT"].presence || "mailto:noreply@rajya.local"
    end

    def details
      { subject: subject, public_key: public_key, private_key: private_key }
    end
  end
end
