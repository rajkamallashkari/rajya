# Revision-cursor catch-up (BR-30, BR-33). Tombstones stay in the result so
# a reconnecting client learns about unsends; reactions bump revision (BR-26).
module Messages
  class CatchUp < ApplicationQuery
    def initialize(scope:, after:)
      @scope = Preloader.apply(scope)
      @after = after
    end

    def call
      table = Message.arel_table
      rows = @scope.where(table[:revision].gt(@after)).order(:revision).to_a
      return PageResult.empty if rows.empty?

      ordered = rows.sort_by(&:position)
      PageResult.new(
        messages: ordered,
        has_more_before: false,
        has_more_after: false,
        oldest_position: ordered.first.position,
        newest_position: ordered.last.position,
        pivot_id: nil
      )
    end
  end
end
