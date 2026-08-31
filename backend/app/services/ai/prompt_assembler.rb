# Builds the bot_reply message list: persona + template, shared memories (NR-11),
# rolling summary, quoted reply-target (NR-12), and the last N turns (BR-74).
module Ai
  class PromptAssembler
    HUMAN_ROLE = "user"
    BOT_ROLE = "assistant"
    SYSTEM_ROLE = "system"
    SUMMARY_PREFIX = "Summary of earlier conversation:"
    QUOTE_PREFIX = "The user is replying to this earlier message (quoted context, distinct from history):"
    COMMAND_PREFIX = "The user invoked a slash command (ordinary chat message, distinct from history):"
    HELP_PREFIX = "The user asked which commands are available in this conversation:"

    def self.messages(...)
      new(...).messages
    end

    def initialize(conversation:, bot:, triggered_by:)
      @conversation = conversation
      @bot = bot
      @triggered_by = triggered_by
    end

    def messages
      [ system_message, memory_message, summary_message, quote_message, slash_message, *history_messages ].compact
    end

    private

    def system_message
      { role: SYSTEM_ROLE, content: [ @bot.persona_prompt.to_s.strip, PromptTemplate.fetch(:bot_reply) ].join("\n\n") }
    end

    def memory_message
      rows = Bots::RetrieveMemories.call(
        bot: @bot, query: @triggered_by.body, account: @triggered_by.sender_account
      ).value
      return if rows.blank?

      facts = rows.map(&:content).compact_blank
      return if facts.empty?

      { role: SYSTEM_ROLE, content: "#{PromptTemplate.fetch(:memory_context)}\n#{facts.join("\n")}" }
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

    def slash_message
      command = SlashCommands::Parser.parse(@triggered_by.body)
      return if command.nil?

      if command.name == SlashCommands::Builtins::HELP
        return { role: SYSTEM_ROLE, content: "#{HELP_PREFIX}\n#{help_listing}" }
      end

      row = @bot.bot_commands.find_by(name: command.name)
      return if row.nil?

      { role: SYSTEM_ROLE,
        content: "#{COMMAND_PREFIX}\n/#{row.name} #{row.description}\nArguments: #{command.arguments}" }
    end

    def help_listing
      declared = @bot.bot_commands.order(:position, :name).map do |row|
        hint = row.usage_hint.present? ? " #{row.usage_hint}" : ""
        "/#{row.name} — #{row.description}#{hint}"
      end
      builtins = SlashCommands::Builtins.entries.map { |row| "/#{row.name} — #{row.description}" }
      (builtins + declared).join("\n")
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
