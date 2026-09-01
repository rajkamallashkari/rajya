# Merged admin theme overrides (NR-48). Cached per theme; invalidated on write.
module Theme
  module Overrides
    CACHE_PREFIX = "rajya/theme"

    class << self
      def fetch(theme)
        theme = theme.to_s
        Rails.cache.fetch(cache_key(theme)) { palette_for(theme) }
      end

      def invalidate(theme)
        Rails.cache.delete(cache_key(theme.to_s))
      end

      def palette_for(theme)
        palette = Theme::Tokens.defaults_for(theme)
        ThemeOverride.where(theme: theme).find_each do |row|
          palette[row.token_name] = row.value
        end
        palette
      end

      def admin_listing
        Theme::Tokens::THEMES.index_with { |theme| tokens_for(theme) }
      end

      def tokens_for(theme)
        palette = palette_for(theme)
        defaults = Theme::Tokens.defaults_for(theme)
        Theme::Tokens::OVERRIDABLE.map do |token|
          {
            "token_name" => token,
            "default" => defaults.fetch(token),
            "value" => palette.fetch(token),
            "overridden" => palette.fetch(token) != defaults.fetch(token)
          }
        end
      end

      private

      def cache_key(theme)
        "#{CACHE_PREFIX}/#{theme}"
      end
    end
  end
end
