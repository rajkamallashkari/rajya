module Search
  class Snippet < ApplicationQuery
    ELLIPSIS = "\u2026"

    def initialize(text, query)
      @text = text.to_s
      @query = query.to_s
    end

    def call
      return @text.truncate(Settings.fetch(:search_snippet_radius)) if needle.empty?

      idx = @text.downcase.index(needle)
      return @text.truncate(Settings.fetch(:search_snippet_radius)) if idx.nil?

      radius = Settings.fetch(:search_snippet_radius)
      start_pos = [ idx - radius, 0 ].max
      end_pos = [ idx + needle.length + radius, @text.length ].min
      snippet = @text[start_pos...end_pos]
      snippet = "#{ELLIPSIS}#{snippet}" if start_pos.positive?
      snippet = "#{snippet}#{ELLIPSIS}" if end_pos < @text.length
      snippet
    end

    private

    def needle
      @needle ||= @query.downcase.scan(/[[:alnum:]_]+/).first.to_s
    end
  end
end
