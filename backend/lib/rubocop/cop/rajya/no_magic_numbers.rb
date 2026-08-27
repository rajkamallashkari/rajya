# frozen_string_literal: true

module RuboCop
  module Cop
    module Rajya
      # Numeric literals in domain code must come from Settings.fetch
      # (SCHEMA_DESIGN.md §8 / CONVENTIONS.md §5). Allowed: 0, 1, -1, or an
      # explicit disable with a reason.
      class NoMagicNumbers < Base
        MSG = "Numeric literals belong in the Settings registry; use Settings.fetch. " \
              "Allowed: 0, 1, -1, or rubocop:disable Rajya/NoMagicNumbers with a reason."
        ALLOWED = [ 0, 1, -1 ].freeze

        def on_int(node)
          check(node, node.value)
        end
        alias on_float on_int

        private

        def check(node, value)
          return if ALLOWED.include?(value)
          return if node.each_ancestor.any?(&:regexp_type?)

          add_offense(node)
        end
      end
    end
  end
end
