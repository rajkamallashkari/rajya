module Auth
  module Passkeys
    class Rename < Auth::Operation
      def call(passkey:, nickname:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged

        name = nickname.to_s.strip.presence
        return failure(:validation_failed, details: nickname_blank) if name.blank?

        passkey.update!(nickname: name)
        success(passkey)
      end

      private

      def nickname_blank
        { nickname: [ Catalog.t("errors.models.passkey.nickname_blank") ] }
      end
    end
  end
end
