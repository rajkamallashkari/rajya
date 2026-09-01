module Admin
  module Impersonation
    class Start < ApplicationOperation
      def call(admin:, account:, session:, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if account.nil?
        return failure(:unauthenticated) if session.nil?

        Audit::Record.call(
          admin: admin,
          action: "impersonation.start",
          impersonated_account: account,
          target: account,
          ip: ip
        )
        token = Auth::Token.encode(
          admin,
          jti: session.jti,
          expires_at: session.expires_at,
          account_id: account.id,
          impersonator_id: admin.id
        )
        success(Auth::Session::Payload.new(token: token, account: account, user: admin))
      end
    end

    class Stop < ApplicationOperation
      def call(admin:, impersonated_account:, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed) if impersonated_account.nil? || impersonated_account.id == admin.account_id

        Audit::Record.call(
          admin: admin,
          action: "impersonation.stop",
          impersonated_account: impersonated_account,
          target: impersonated_account,
          ip: ip
        )
        success(true)
      end
    end
  end
end
