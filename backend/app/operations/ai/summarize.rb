module Ai
  Summary = Struct.new(:text, :mode, keyword_init: true)

  class Summarize < ApplicationOperation
    MODES = %w[unread recent].freeze

    def call(account:, conversation:, mode: "unread")
      chosen = mode.to_s.presence || "unread"
      return failure(:validation_failed) unless MODES.include?(chosen)

      bodies = excerpt(account, conversation, chosen)
      return failure(:validation_failed) if bodies.empty?

      outcome = Complete.call(
        account: account, capability: :summarize, conversation: conversation,
        messages: [
          { role: "system", content: PromptTemplate.fetch(:summarize) },
          { role: "user", content: bodies.join("\n") }
        ]
      )
      return outcome unless outcome.success?

      success(Summary.new(text: outcome.value.text.strip, mode: chosen))
    end

    private

    def excerpt(account, conversation, mode)
      visible = conversation.messages.visible.where.not(kind: "system").order(:position)
      if mode == "unread"
        membership = conversation.conversation_memberships.find_by(account: account)
        seen = membership&.last_seen_position.to_i
        # rubocop:disable Rajya/NoUserFacingStrings -- SQL predicate, not UI copy
        visible = visible.where("position > ?", seen)
        # rubocop:enable Rajya/NoUserFacingStrings
      else
        visible = visible.last(Limits.context_window)
      end
      Array(visible).filter_map { |message| message.body.to_s.strip.presence }
    end
  end
end
