# Resolves a JWT to the human who authenticated (`user`) and the participant
# they act as (`account`). Fail closed: missing claims, a stale epoch, a
# deactivated account, or an account_id that does not match the user's side
# table all return nil — the controller/connection then rejects (F-6).
module Auth
  class Identity
    Context = Struct.new(:user, :account, keyword_init: true)

    BEARER = "Bearer"

    class << self
      def from_http(request)
        header = request.headers["Authorization"]
        return if header.blank?

        scheme, token = header.split(" ", 2)
        return unless scheme.to_s.casecmp(BEARER).zero?

        resolve(token)
      end

      def from_cable(request)
        resolve(request.params[:token].presence)
      end

      def resolve(token)
        return if token.blank?

        payload = Token.decode(token)
        user = User.includes(:account).find_by(id: payload["sub"].to_i)
        return if user.nil?
        return unless payload.key?("credentials_epoch")
        return unless user.credentials_epoch == payload["credentials_epoch"].to_i

        account = user.account
        return if account.deactivated?
        return unless payload["account_id"].to_i == account.id

        Context.new(user: user, account: account)
      rescue Token::DecodeError
        nil
      end
    end
  end
end
