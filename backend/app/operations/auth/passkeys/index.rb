module Auth
  module Passkeys
    class Index < Auth::Operation
      Payload = Struct.new(:passkeys, keyword_init: true)

      def call(passkeys:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged

        success(Payload.new(passkeys: passkeys.order(:created_at)))
      end
    end
  end
end
