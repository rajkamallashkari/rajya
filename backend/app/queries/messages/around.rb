# Jump window centred on a pivot message (BR-108 jump_window).
module Messages
  class Around < ApplicationQuery
    def initialize(scope:, pivot:)
      @scope = Preloader.apply(scope)
      @pivot = pivot
    end

    def call
      window = Settings.fetch(:jump_window)
      table = Message.arel_table
      distance = Arel::Nodes::NamedFunction.new(
        "ABS",
        [ Arel::Nodes::Grouping.new(table[:position] - Integer(@pivot.position)) ]
      )
      rows = @scope.order(distance).limit(window).to_a
      PageResult.from(rows, scope: @scope, pivot_id: @pivot.id)
    end
  end
end
