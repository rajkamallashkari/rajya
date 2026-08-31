# Builds the bot_reply message list: persona + template, rolling summary,
# quoted reply-target (NR-12), and the last N turns (BR-74).
module Ai
  class PromptAssembler
    HUMAN_ROLE = "user"
    BOT_ROLE = "assistant"
    SYSTEM_ROLE = "system"
    SUMMARY_PREFIX = "Summary of earlier conversation:"
    QUOTE_PREFIX = "The user is replying to this earlier message (quoted context, distinct from history):"

    def self.messages(...)
      new(...).messages
    end

    def initialize(conversation:, bot:, triggered_by:)
      @conversation = conversation
      @bot = bot
      @triggered_by = triggered_by
    end

    def messages
      [ system_message, summary_message, quote_message, *history_messages ].compact
    end

    private

    def system_message
      { role: SYSTEM_ROLE, content: [ @bot.persona_prompt.to_s.strip, PromptTemplate.fetch(:bot_reply) ].join("\n\n") }
    end

    def summary_message
      summary = @conversation.context_summary.to_s.strip
      return if summary.blank?

      { role: SYSTEM_ROLE, content: "#{SUMMARY_PREFIX}\n#{summary}" }
    end

    def quote_message
      quoted = @triggered_by.reply_to_message
      return if quoted.nil? || quoted.deleted? || quoted.body.blank?

      clip = Settings.fetch(:reply_quote_length)
      { role: SYSTEM_ROLE, content: "#{QUOTE_PREFIX}\n#{quoted.body.to_s[0, clip]}" }
    end

    def history_messages
      window = visible.order(position: :desc).limit(Limits.context_window).to_a.reverse
      window.filter_map { |message| turn_for(message) }
    end

    def visible
      @conversation.messages.visible.where.not(kind: "system")
    end

    def turn_for(message)
      body = message.body.to_s.strip
      return if body.blank?

      { role: message.sender_account&.bot? ? BOT_ROLE : HUMAN_ROLE, content: body }
    end
  end
end
