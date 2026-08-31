module Bots
  module Requests
    class Create < ApplicationOperation
      def call(requester:, kind:, payload:, target_bot_id: nil)
        return failure(:not_found) unless FeatureFlag.enabled?(:bot_builder, account: requester)

        chosen = kind.to_s.presence || "create"
        return failure(:validation_failed) unless BotRequest::KINDS.include?(chosen)

        attrs = normalize(payload)
        error = validate_payload(attrs)
        return error if error

        target = nil
        if chosen == "edit"
          target = Bot.active.find_by(id: target_bot_id)
          return failure(:not_found) if target.nil?
          return failure(:forbidden) unless target.owner_account_id == requester.id
          return failure(:conflict) if BotRequest.pending.where(kind: "edit", target_bot_id: target.id).exists?
        end

        request = BotRequest.create!(
          requester_account: requester, kind: chosen, status: "pending",
          payload: attrs, target_bot: target
        )
        success(request)
      end

      private

      def normalize(payload)
        raw = payload.respond_to?(:to_unsafe_h) ? payload.to_unsafe_h : payload.to_h
        raw.stringify_keys.slice(*BotRequest::PAYLOAD_KEYS).transform_values { |value| value.to_s.strip }
      end

      def validate_payload(attrs)
        return failure(:validation_failed) if attrs["name"].blank?
        return failure(:validation_failed) if attrs["username"].blank?
        return failure(:validation_failed) unless Auth::Usernames.valid_format?(attrs["username"])
        return failure(:validation_failed) if attrs["bio"].blank?

        prompt = attrs["persona_prompt"].to_s
        return failure(:validation_failed) if prompt.length < Ai::Limits.prompt_minimum_length

        nil
      end
    end
  end
end
