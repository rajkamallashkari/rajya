module Bots
  module Requests
    class Destroy < ApplicationOperation
      def call(actor:, request:)
        return failure(:not_found) if request.nil?
        return failure(:forbidden) unless request.requester_account_id == actor.id
        return failure(:conflict) unless request.pending? || request.status == "declined"

        Avatar.cleanup!(request)
        request.destroy!
        success(true)
      end
    end
  end
end
