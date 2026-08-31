# Four-scope notification merge over one preferences JSONB document (BR-98).
# Later scopes override earlier ones key-by-key. Unknown keys are rejected (BR-99).
module Notifications
  class Cascade
    class UnknownKey < StandardError; end

    KEYS = %w[level show_preview sound vibration dnd_enabled dnd_start dnd_end dnd_days].freeze

    def self.merge(document, kind:, conversation_id:)
      new(document, kind: kind, conversation_id: conversation_id).merge
    end

    def initialize(document, kind:, conversation_id:)
      @document = document
      @kind = kind
      @conversation_id = conversation_id
    end

    def merge
      [
        defaults,
        scope_at("global"),
        scope_at("kind:#{@kind}"),
        scope_at("conversation:#{@conversation_id}")
      ].reduce({}) { |acc, layer| acc.merge(layer) }
    end

    private

    def defaults
      slice_scope(Settings.fetch(:notification_cascade_defaults), reject_unknown: false)
    end

    def scope_at(key)
      slice_scope(notifications[key])
    end

    def notifications
      return {} unless @document.is_a?(Hash)

      raw = @document.stringify_keys["notifications"]
      raw.is_a?(Hash) ? raw.stringify_keys : {}
    end

    def slice_scope(scope, reject_unknown: true)
      return {} unless scope.is_a?(Hash)

      hash = scope.stringify_keys
      extra = hash.keys - KEYS
      raise UnknownKey, extra.join(", ") if reject_unknown && extra.any?

      hash.slice(*KEYS)
    end
  end
end
