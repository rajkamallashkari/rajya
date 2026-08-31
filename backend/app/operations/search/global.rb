module Search
  class Global < ApplicationOperation
    def call(account:, query:, filters: {})
      parsed = Search::Filters.parse(filters)
      return failure(:validation_failed) if parsed.nil?

      stripped = query.to_s.strip
      return success(empty(stripped)) if too_short?(stripped) && !parsed.present?

      success(
        Search::GlobalPayload.new(
          query: stripped,
          messages: Search::MessageHits.call(
            account: account,
            query: too_short?(stripped) ? "" : stripped,
            distinct_conversation: true,
            filters: parsed
          ),
          accounts: too_short?(stripped) ? [] : Search::AccountHits.call(account: account, query: stripped),
          conversations: too_short?(stripped) ? [] : Search::ConversationHits.call(account: account, query: stripped)
        )
      )
    end

    private

    def too_short?(query)
      query.length < Settings.fetch(:search_min_query_length)
    end

    def empty(query)
      Search::GlobalPayload.new(query: query, messages: [], accounts: [], conversations: [])
    end
  end
end
