# Effective notification settings for one (account, conversation, message).
# `message` is required so "mentions only" cannot evaluate an empty body (F-9).
module Notifications
  class Resolve < ApplicationOperation
    Resolution = Struct.new(:notify, :settings, :reason, keyword_init: true)

    def call(account:, conversation:, message:)
      raise ArgumentError, "missing keyword: :message" if message.nil?

      settings = Cascade.merge(
        document_for(account),
        kind: conversation.kind,
        conversation_id: conversation.id
      )
      success(decide(account, conversation, message, settings))
    rescue Cascade::UnknownKey
      failure(:validation_failed)
    end

    private

    def document_for(account)
      data = account.preference&.data
      data.is_a?(Hash) ? data : {}
    end

    def decide(account, conversation, message, settings)
      membership = Conversations::View.membership_for(conversation, account)
      reason = suppress_reason(conversation, membership, account, message, settings)
      Resolution.new(notify: reason.nil?, settings: settings, reason: reason || settings["level"].to_s.to_sym)
    end

    def suppress_reason(conversation, membership, account, message, settings)
      return :channel if conversation.channel?
      return :muted if muted?(membership)
      return :dnd if Dnd.active?(
        settings: settings,
        timezone: account.preference&.timezone || Preference::DEFAULT_TIMEZONE
      )
      return :none if settings["level"] == "none"
      return :mentions if settings["level"] == "mentions" && !mentioned?(account, conversation, message, membership)

      nil
    end

    def muted?(membership)
      membership&.muted_until.present? && membership.muted_until > Time.current
    end

    def mentioned?(account, conversation, message, membership)
      return true if conversation.direct?

      parsed = Mentions::Parser.parse(message.body)
      return true if parsed.account_ids.include?(account.id)
      return true if parsed.everyone
      return true if parsed.admins && membership&.admin_or_owner?

      false
    end
  end
end
