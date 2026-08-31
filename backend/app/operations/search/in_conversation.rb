module Search
  class InConversation < ApplicationOperation
    def call(account:, conversation:, query:, filters: {})
      parsed = Search::Filters.parse(filters)
      return failure(:validation_failed) if parsed.nil?

      stripped = query.to_s.strip
      return success(Search::ConversationPayload.new(query: stripped, messages: [])) if too_short?(stripped) && !parsed.present?

      success(
        Search::ConversationPayload.new(
          query: stripped,
          messages: Search::MessageHits.call(
            account: account,
            query: too_short?(stripped) ? "" : stripped,
            conversation: conversation,
            filters: parsed
          )
        )
      )
    end

    private

    def too_short?(query)
      query.length < Settings.fetch(:search_min_query_length)
    end
  end
end
