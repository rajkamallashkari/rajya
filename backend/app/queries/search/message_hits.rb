module Search
  # SQL predicates — not user-facing copy.
  # rubocop:disable Rajya/NoUserFacingStrings
  class MessageHits < ApplicationQuery
    LINK_SQL = "messages.body ~* 'https?://'"

    def initialize(account:, query:, conversation: nil, distinct_conversation: false, filters: Search::Filters.empty)
      @account = account
      @query = query
      @conversation = conversation
      @distinct_conversation = distinct_conversation
      @filters = filters
    end

    def call
      tsquery = Search::Tsquery.call(@query)
      return [] if tsquery.blank? && !@filters.present?

      rows = load_rows(tsquery)
      rows.map { |message| hit_for(message) }
    end

    def relation
      ordered(apply_filters(fts(base_scope, Search::Tsquery.call(@query))))
    end

    private

    def load_rows(tsquery)
      scope = ordered(apply_filters(fts(base_scope, tsquery)))
      ids = scope.limit(Settings.fetch(:search_page_size)).map(&:id)
      Message.where(id: ids).includes(:sender_account, :conversation).sort_by { |row| -row.created_at.to_i }
    end

    def base_scope
      scope = Message.visible
      if @conversation
        return scope.where(conversation_id: @conversation.id)
      end

      scope.joins(conversation: :conversation_memberships)
           .merge(ConversationMembership.active)
           .where(conversation_memberships: { account_id: @account.id })
    end

    def ordered(scope)
      if @distinct_conversation
        return scope.select("DISTINCT ON (messages.conversation_id) messages.*")
                    .order("messages.conversation_id, messages.created_at DESC")
      end
      return scope.order(position: :desc) if @conversation && @filters.sender_account_id

      scope.order(created_at: :desc)
    end

    def fts(scope, tsquery)
      return scope if tsquery.blank?

      scope.where("messages.search_vector @@ to_tsquery('simple', ?)", tsquery)
    end

    def apply_filters(scope)
      scope = sender_scope(scope)
      scope = scope.where("messages.created_at >= ?", @filters.created_after) if @filters.created_after
      scope = scope.where("messages.created_at <= ?", @filters.created_before) if @filters.created_before
      scope = scope.where(kind: @filters.kind) if @filters.kind
      scope = attachment_scope(scope)
      link_scope(scope)
    end

    def sender_scope(scope)
      return scope unless @filters.sender_account_id
      return scope.where(conversation_id: @conversation.id, sender_account_id: @filters.sender_account_id) if @conversation

      scope.where(sender_account_id: @filters.sender_account_id)
    end

    def attachment_scope(scope)
      return scope if @filters.has_attachment.nil?
      return scope.where("messages.attachment_count > 0") if @filters.has_attachment

      scope.where(messages: { attachment_count: 0 })
    end

    def link_scope(scope)
      return scope if @filters.has_link.nil?
      return scope.where(LINK_SQL) if @filters.has_link

      scope.where("NOT (#{LINK_SQL}) OR messages.body IS NULL")
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
