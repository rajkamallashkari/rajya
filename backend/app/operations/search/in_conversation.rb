module Search
  class InConversation < ApplicationOperation
    def call(account:, conversation:, query:)
      stripped = query.to_s.strip
      return success(Search::ConversationPayload.new(query: stripped, messages: [])) if stripped.length < Settings.fetch(:search_min_query_length)

      success(
        Search::ConversationPayload.new(
          query: stripped,
          messages: Search::MessageHits.call(account: account, query: stripped, conversation: conversation)
        )
      )
    end
  end
end
