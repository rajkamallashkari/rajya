module Search
  # SQL predicates — not user-facing copy.
  # rubocop:disable Rajya/NoUserFacingStrings
  class MessageHits < ApplicationQuery
    def initialize(account:, query:, conversation: nil, distinct_conversation: false)
      @account = account
      @query = query
      @conversation = conversation
      @distinct_conversation = distinct_conversation
    end

    def call
      tsquery = Search::Tsquery.call(@query)
      return [] if tsquery.blank?

      rows = load_rows(tsquery)
      rows.map { |message| hit_for(message) }
    end

    private

    def load_rows(tsquery)
      scope = Message.visible
                     .joins(conversation: :conversation_memberships)
                     .merge(ConversationMembership.active)
                     .where(conversation_memberships: { account_id: @account.id })
                     .where("messages.search_vector @@ to_tsquery('simple', ?)", tsquery)
      scope = scope.where(messages: { conversation_id: @conversation.id }) if @conversation
      ordered = if @distinct_conversation
        scope.select("DISTINCT ON (messages.conversation_id) messages.*")
             .order("messages.conversation_id, messages.created_at DESC")
      else
        scope.order("messages.created_at DESC")
      end
      ids = ordered.limit(Settings.fetch(:search_page_size)).map(&:id)
      Message.where(id: ids).includes(:sender_account, :conversation).sort_by { |row| -row.created_at.to_i }
    end

    def hit_for(message)
      Search::MessageHit.new(
        message: message,
        snippet: Search::Snippet.call(message.body.to_s, @query),
        can_forward: !message.conversation.restrict_forwarding
      )
    end
  end
  # rubocop:enable Rajya/NoUserFacingStrings
end
