# Cursor page by position (BR-108). Tombstones stay in the page (BR-30).
module Messages
  class Page < ApplicationQuery
    def initialize(scope:, before: nil, after: nil)
      @scope = Preloader.apply(scope)
      @before = before
      @after = after
    end

    def call
      rows = slice
      PageResult.from(rows, scope: @scope)
    end

    private

    def slice
      limit = Settings.fetch(:message_page_size)
      table = Message.arel_table
      if @after.present?
        @scope.where(table[:position].gt(@after)).order(:position).limit(limit).to_a
      elsif @before.present?
        @scope.where(table[:position].lt(@before)).order(position: :desc).limit(limit).to_a
      else
        @scope.order(position: :desc).limit(limit).to_a
      end
    end
  end
end
