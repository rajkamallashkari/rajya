module Invites
  class Create < ApplicationOperation
    def call(actor:, conversation:, requires_approval: false, max_uses: nil, expires_in_seconds: nil)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).create_invite?
      return failure(:validation_failed) unless valid_max_uses?(max_uses)
      return failure(:validation_failed) unless valid_expiry?(expires_in_seconds)

      invite = conversation.group_invites.create!(
        created_by_account: actor,
        requires_approval: ActiveModel::Type::Boolean.new.cast(requires_approval) || false,
        max_uses: max_uses.presence && max_uses.to_i,
        expires_at: expires_at_for(expires_in_seconds)
      )
      success(invite)
    end

    private

    def valid_max_uses?(max_uses)
      return true if max_uses.blank?

      value = max_uses.to_i
      value >= 1 && value <= Settings.fetch(:invite_max_uses_ceiling)
    end

    def valid_expiry?(expires_in_seconds)
      return true if expires_in_seconds.nil?

      expires_in_seconds.to_i >= 0
    end

    def expires_at_for(expires_in_seconds)
      seconds = expires_in_seconds.nil? ? Settings.fetch(:invite_token_ttl) : expires_in_seconds.to_i
      return if seconds.zero?

      Time.current + seconds.seconds
    end
  end
end
