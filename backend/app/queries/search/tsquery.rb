module Search
  class Tsquery < ApplicationQuery
    def initialize(raw)
      @raw = raw.to_s
    end

    def call
      tokens = @raw.downcase.scan(/[[:alnum:]_]+/)
      return if tokens.empty?

      tokens.map { |token| "#{token}:*" }.join(" & ")
    end
  end
end
