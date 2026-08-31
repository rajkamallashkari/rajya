module Bots
  # Turns a human message into shared bot_memories rows (NR-11). Failures skip
  # so a flaky embedder never blocks send.
  class ExtractMemory < ApplicationOperation
    NONE = "NONE"

    def call(bot:, message:)
      return success(0) if skip?(bot, message)

      facts = extract_facts(bot, message)
      return success(0) if facts.empty?

      vectors = embed(facts, message)
      return success(0) if vectors.blank? || vectors.size != facts.size

      persist(bot, message, facts, vectors)
      success(facts.size)
    end

    def self.enqueue(message)
      return if message.nil? || message.body.blank?
      return unless message.sender_account&.human?

      bot_members(message.conversation).each do |bot|
        next unless bot.memory_enabled?

        ExtractMemoryJob.perform_later(bot.id, message.id)
      end
    end

    def self.bot_members(conversation)
      ConversationMembership.active.where(conversation_id: conversation.id)
                            .includes(account: :bot)
                            .filter_map { |row| row.account.bot if row.account.bot? }
    end

    private

    def skip?(bot, message)
      bot.nil? || message.nil? || !bot.memory_enabled? || message.body.blank? ||
        !message.sender_account&.human?
    end

    def extract_facts(bot, message)
      result = Ai::Runner.chat(
        messages: [
          { role: "system", content: Ai::PromptTemplate.fetch(:memory_extract) },
          { role: "user", content: message.body.to_s }
        ],
        capability: :memory_extract,
        account: message.sender_account,
        conversation: message.conversation
      )
      return [] if result.status != "success"

      parse_facts(result.text)
    end

    def parse_facts(text)
      lines = text.to_s.lines.map { |line| line.strip.sub(/\A[-*]\s*/, "") }.compact_blank
      return [] if lines.empty? || lines.first.to_s.upcase == NONE

      lines.first(Ai::Limits.memory_extract_max)
    end

    def embed(facts, message)
      result = Ai::Runner.embed(texts: facts, account: message.sender_account)
      return if result.status != "success"

      Array(result.vectors)
    end

    def persist(bot, message, facts, vectors)
      facts.zip(vectors).each do |content, vector|
        next if Array(vector).empty?

        BotMemory.create!(
          bot: bot,
          content: content,
          source_account: message.sender_account,
          source_message: message,
          embedding: Bots::Vector.literal(vector)
        )
      end
    end
  end
end
