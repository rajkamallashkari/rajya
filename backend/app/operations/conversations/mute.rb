module Conversations
  class Mute < ApplicationOperation
    def call(account:, conversation:, duration:)
      membership = View.membership_for(conversation, account)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).organize?
      return failure(:not_found) if membership.blank?

      seconds = duration.to_i
      return unmute(account, conversation, membership) if seconds.zero?
      return failure(:validation_failed) unless allowed?(seconds)

      membership.update!(muted_until: seconds.seconds.from_now)
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def unmute(account, conversation, membership)
      membership.update!(muted_until: nil)
      success(Show.call(account: account, conversation: conversation).value)
    end

    def allowed?(seconds)
      Array(Settings.fetch(:mute_durations)).map(&:to_i).include?(seconds)
    end
  end
end
