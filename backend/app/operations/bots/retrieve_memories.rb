module Bots
  # Top-k cosine recall over the bot's global memory. Provenance columns are
  # recorded on write and never used as a filter (NR-11).
  class RetrieveMemories < ApplicationOperation
    def call(bot:, query:, account:)
      return success([]) if bot.nil? || !bot.memory_enabled?
      return success([]) if query.to_s.strip.blank?

      vector = embed(query, account)
      return success([]) if vector.blank?

      rows = neighbors(bot, vector)
      touch_recalled!(rows)
      success(rows)
    end

    private

    def embed(query, account)
      result = Ai::Runner.embed(texts: [ query.to_s ], account: account)
      return if result.status != "success"

      Array(result.vectors&.first).presence
    rescue StandardError, ArgumentError, TypeError
      nil
    end

    def neighbors(bot, vector)
      BotMemory.where(bot_id: bot.id).where.not(embedding: nil)
               # rubocop:disable Rajya/NoUserFacingStrings -- SQL order fragment, not UI copy
               .order(Arel.sql("embedding <=> #{Bots::Vector.quoted(vector)}::vector"))
               # rubocop:enable Rajya/NoUserFacingStrings
               .limit(Ai::Limits.memory_top_k)
    end

    def touch_recalled!(rows)
      ids = rows.map(&:id)
      return if ids.empty?

      BotMemory.where(id: ids).update_all(last_recalled_at: Time.current)
    end
  end
end
