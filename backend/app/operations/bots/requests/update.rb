module Bots
  module Requests
    class Update < ApplicationOperation
      def call(actor:, request:, payload:, avatar: nil, avatar_provided: false)
        return failure(:not_found) if request.nil?
        return failure(:forbidden) unless request.requester_account_id == actor.id
        return failure(:conflict) if request.status == "approved"

        attrs = normalize(payload)
        return failure(:validation_failed) unless valid_payload?(attrs)

        updated = false
        BotRequest.transaction do
          request.update!(payload: attrs, status: "pending", decline_reason: nil)
          updated = Avatar.stage!(request, value: avatar, provided: avatar_provided)
          raise ActiveRecord::Rollback unless updated
        end
        updated ? success(request.reload) : failure(:validation_failed)
      end

      private

      def normalize(payload)
        raw = payload.respond_to?(:to_unsafe_h) ? payload.to_unsafe_h : payload.to_h
        raw.stringify_keys.slice(*BotRequest::PAYLOAD_KEYS).transform_values { |value| value.to_s.strip }
      end

      def valid_payload?(attrs)
        attrs["name"].present? &&
          attrs["username"].present? &&
          Auth::Usernames.valid_format?(attrs["username"]) &&
          attrs["bio"].present? &&
          attrs["persona_prompt"].to_s.length >= Ai::Limits.prompt_minimum_length
      end
    end
  end
end
