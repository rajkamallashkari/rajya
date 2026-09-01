# Flattens locale YAML into dotted keys for the string catalogue (TARGET §7.2).
module Catalog
  module Flat
    class << self
      def locale_defaults(locale)
        path = Rails.root.join("config/locales/#{locale}.yml")
        from_hash(YAML.load_file(path).fetch(locale.to_s))
      end

      def from_hash(hash, prefix = nil)
        hash.each_with_object({}) do |(nested_key, value), out|
          key = prefix ? "#{prefix}.#{nested_key}" : nested_key.to_s
          if value.is_a?(Hash)
            out.merge!(from_hash(value, key))
          else
            out[key] = value.to_s
          end
        end
      end
    end
  end
end
