module Calls
  class Page < ApplicationQuery
    Result = Struct.new(:calls, :page, :per_page, :total, :has_more, keyword_init: true)
    Entry = Struct.new(:call, :viewer, keyword_init: true) do
      def conversation
        call.conversation
      end

      def peer
        return unless conversation.direct?

        call.call_participants.map(&:account).find { |account| account.id != viewer.id }
      end

      def title
        return conversation.title unless conversation.direct?

        peer&.display_name
      end
    end

    def initialize(account:, scope:, page: 1)
      @account = account
      @scope = scope
      @page = [ page.to_i, 1 ].max
    end

    def call
      per_page = Settings.fetch(:call_page_size)
      relation = scoped
      total = relation.unscope(:order, :includes).count
      offset = (@page - 1) * per_page
      rows = relation.offset(offset).limit(per_page).to_a
      Result.new(
        calls: rows.map { |call| Entry.new(call: call, viewer: @account) },
        page: @page,
        per_page: per_page,
        total: total,
        has_more: total > @page * per_page
      )
    end

    private

    def scoped
      @scope.includes(
        conversation: {
          conversation_memberships: {
            account: [ avatar_attachment: :blob ]
          }
        },
        call_participants: {
          account: [ avatar_attachment: :blob ]
        }
      ).order(created_at: :desc, id: :desc)
    end
  end
end
