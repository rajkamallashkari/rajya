module Search
  class Global < ApplicationOperation
    def call(account:, query:)
      stripped = query.to_s.strip
      return success(empty(stripped)) if stripped.length < Settings.fetch(:search_min_query_length)

      success(
        Search::GlobalPayload.new(
          query: stripped,
          messages: Search::MessageHits.call(account: account, query: stripped, distinct_conversation: true),
          accounts: Search::AccountHits.call(account: account, query: stripped),
          conversations: Search::ConversationHits.call(account: account, query: stripped)
        )
      )
    end

    private

    def empty(query)
      Search::GlobalPayload.new(query: query, messages: [], accounts: [], conversations: [])
    end
  end
end
