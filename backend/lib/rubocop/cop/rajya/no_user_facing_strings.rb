# frozen_string_literal: true

module RuboCop
  module Cop
    module Rajya
      # User-facing copy must go through Catalog.t / t() (TARGET §7.2).
      # Sentence-like string literals (a letter plus a space) are rejected
      # unless they are arguments to t, Catalog.t, I18n.t, or raise.
      class NoUserFacingStrings < Base
        MSG = "User-facing strings belong in the catalog; use Catalog.t / t()."
        ALLOWED_METHODS = %i[t raise].freeze

        def on_str(node)
          return if node.parent&.dstr_type?
          return unless sentence_like?(node.value)
          return if allowed?(node)

          add_offense(node)
        end

        def on_dstr(node)
          combined = node.each_descendant(:str).map(&:value).join
          return unless sentence_like?(combined)
          return if allowed?(node)

          add_offense(node)
        end

        private

        SQL_PREFIX = /\A\s*(ALTER|CREATE|DELETE|DROP|INSERT|SELECT|UPDATE|WITH)\b/i

        def sentence_like?(value)
          return false if value.match?(SQL_PREFIX)

          value.match?(/[A-Za-z].*\s+\S/)
        end

        def allowed?(node)
          parent = node.parent
          parent = parent.parent if parent&.pair_type?
          parent&.send_type? && ALLOWED_METHODS.include?(parent.method_name)
        end
      end
    end
  end
end
