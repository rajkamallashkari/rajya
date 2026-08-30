module Messages
  PageResult = Struct.new(
    :messages,
    :has_more_before,
    :has_more_after,
    :oldest_position,
    :newest_position,
    :pivot_id,
    keyword_init: true
  ) do
    def self.empty(pivot_id: nil)
      new(
        messages: [],
        has_more_before: false,
        has_more_after: false,
        oldest_position: nil,
        newest_position: nil,
        pivot_id: pivot_id
      )
    end

    def self.from(rows, scope:, pivot_id: nil)
      return empty(pivot_id: pivot_id) if rows.empty?

      ordered = rows.sort_by(&:position)
      oldest = ordered.first.position
      newest = ordered.last.position
      new(
        messages: ordered,
        has_more_before: scope.where(Message.arel_table[:position].lt(oldest)).exists?,
        has_more_after: scope.where(Message.arel_table[:position].gt(newest)).exists?,
        oldest_position: oldest,
        newest_position: newest,
        pivot_id: pivot_id
      )
    end
  end
end
