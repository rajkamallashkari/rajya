module Bots
  module Requests
    class Decline < ApplicationOperation
      def call(admin:, request:, reason: nil, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if request.nil?
        return failure(:conflict) unless request.pending?

        Audit::Record.call(
          admin: admin, action: "bot_request.decline", target: request,
          metadata: { "reason" => reason.to_s }, ip: ip
        )

        request.update!(status: "declined", decline_reason: reason.to_s.strip.presence)
        success(request)
      end
    end
  end
end
