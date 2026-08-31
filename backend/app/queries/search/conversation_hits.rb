module Search
  # SQL predicates — not user-facing copy.
  # rubocop:disable Rajya/NoUserFacingStrings
  class ConversationHits < ApplicationQuery
    def initialize(account:, query:)
      @account = account
      @query = query.to_s.strip
    end

    def call
      return [] if @query.length < Settings.fetch(:search_min_query_length)

      Conversation.where(id: matching_ids)
                  .includes(conversation_memberships: :account)
                  .limit(Settings.fetch(:search_page_size))
                  .map { |conversation| hit_for(conversation) }
    end

    private

    def matching_ids
      membership_ids = ConversationMembership.active.where(account_id: @account.id).select(:conversation_id)
      titled_ids = Conversation.where(id: membership_ids).where("LOWER(COALESCE(title, '')) LIKE ?", like_pattern).select(:id)
      peer_ids = ConversationMembership.where(conversation_id: membership_ids)
                                       .where.not(account_id: @account.id)
                                       .joins(:account)
                                       .where("LOWER(accounts.display_name) LIKE ? OR LOWER(accounts.username) LIKE ?",
                                              like_pattern, like_pattern)
                                       .select(:conversation_id)
      Conversation.where(id: titled_ids).or(Conversation.where(id: peer_ids)).select(:id)
    end

    def like_pattern
      @like_pattern ||= "%#{Account.sanitize_sql_like(@query.downcase)}%"
    end

    def hit_for(conversation)
      Search::ConversationHit.new(id: conversation.id, title: title_for(conversation), kind: conversation.kind)
    end

    def title_for(conversation)
      return conversation.title if conversation.title.present?

      peer = conversation.conversation_memberships.map(&:account).find { |row| row.id != @account.id }
      peer&.display_name.to_s
    end
  end
  # rubocop:enable Rajya/NoUserFacingStrings
end
