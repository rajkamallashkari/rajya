# User-facing string catalog (TARGET_ARCHITECTURE.md §7.2, CONVENTIONS.md §5).
# Resolution: DB override → locale-file default → the key itself (never blank).
module Catalog
  CACHE_PREFIX = "rajya/translations"

  class << self
    def t(key, **options)
      locale = (options.delete(:locale) || I18n.locale).to_s
      key = key.to_s
      template = cached_value(key, locale) || i18n_default(key, locale) || key
      interpolate(template, options)
    end

    def invalidate(key, locale)
      Rails.cache.delete(cache_key(key, locale))
    end

    def listing(locale:, query: nil, surface: nil)
      defaults = Catalog::Flat.locale_defaults(locale)
      rows = TranslationString.where(locale: locale).index_by(&:key)
      needle = query.to_s.strip.downcase
      prefix = surface.to_s.strip
      (defaults.keys | rows.keys).sort.filter_map do |key|
        default = defaults[key]
        row = rows[key]
        value = row&.value || default
        next if prefix.present? && key.split(".").first != prefix
        next if needle.present? && !catalogue_match?(key, value, default, needle)

        {
          "key" => key,
          "locale" => locale,
          "surface" => key.split(".").first,
          "default" => default,
          "value" => value,
          "overridden" => row&.updated_by_user_id.present?
        }
      end
    end

    private

    def catalogue_match?(key, value, default, needle)
      [ key, value, default ].compact.any? { |part| part.to_s.downcase.include?(needle) }
    end

    def cache_key(key, locale)
      "#{CACHE_PREFIX}/#{locale}/#{key}"
    end

    def cached_value(key, locale)
      Rails.cache.fetch(cache_key(key, locale)) do
        TranslationString.find_by(key: key, locale: locale)&.value
      end
    end

    def i18n_default(key, locale)
      text = I18n.t(key, locale: locale, default: nil)
      text.is_a?(String) ? text : nil
    end

    def interpolate(template, options)
      return template if options.empty?

      template % options
    rescue KeyError, ArgumentError
      template
    end
  end
end
