module Messages
  class Index < ApplicationOperation
    def call(scope:, before: nil, after: nil, around_id: nil, around_at: nil)
      @scope = scope
      @before = parse_cursor(before)
      @after = parse_cursor(after)
      return failure(:validation_failed) if @before == :invalid || @after == :invalid
      return failure(:validation_failed) if @before.present? && @after.present?

      around_id.present? || around_at.present? ? jump(around_id, around_at) : page
    end

    private

    def page
      success(Page.call(scope: @scope, before: @before, after: @after))
    end

    def jump(around_id, around_at)
      pivot = around_id.present? ? @scope.find_by(id: around_id) : pivot_at(around_at)
      return failure(:validation_failed) if pivot == :invalid
      return failure(:not_found) if pivot.nil?

      success(Around.call(scope: @scope, pivot: pivot))
    end

    def pivot_at(value)
      time = Time.iso8601(value.to_s)
      table = Message.arel_table
      @scope.where(table[:created_at].gteq(time)).order(:position).first ||
        @scope.where(table[:created_at].lt(time)).order(position: :desc).first
    rescue ArgumentError, TypeError
      :invalid
    end

    def parse_cursor(value)
      return if value.blank?

      Integer(value)
    rescue ArgumentError, TypeError
      :invalid
    end
  end
end
