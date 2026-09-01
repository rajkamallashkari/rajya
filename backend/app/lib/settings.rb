# Tunable constants (CONVENTIONS.md §5, SCHEMA_DESIGN.md §8). Code-defined
# defaults; `app_settings` rows override; reads are cached and invalidated on
# write. An unregistered key raises in every environment — calling code must
# name a registry entry. A DB row whose key is not registered is ignored and
# reported via `.unregistered_keys`.
module Settings
  UnregisteredKey = Class.new(StandardError)
  CACHE_PREFIX = "rajya/settings"

  class << self
    def fetch(key)
      key = key.to_sym
      definition = Registry.fetch(key) { raise UnregisteredKey, key.to_s }
      payload = Rails.cache.fetch(cache_key(key)) { load_payload(key) }
      payload[:override] ? coerce(payload[:value], definition) : definition.fetch(:default)
    end

    def invalidate(key)
      Rails.cache.delete(cache_key(key))
    end

    def unregistered_keys
      AppSetting.where.not(key: Registry.keys.map(&:to_s)).order(:key).pluck(:key)
    end

    def listed
      payload = registry_payload
      overridden = AppSetting.where(key: Registry.keys.map(&:to_s)).pluck(:key).to_set
      Registry.keys.map do |key|
        payload.fetch(key.to_s).merge(
          "key" => key.to_s,
          "value" => fetch(key),
          "overridden" => overridden.include?(key.to_s)
        )
      end
    end

    def registry_payload
      Registry.entries.each_with_object({}) do |(key, definition), payload|
        payload[key.to_s] = {
          "type" => definition.fetch(:type).to_s,
          "category" => definition.fetch(:category).to_s,
          "default" => definition.fetch(:default),
          "description" => definition.fetch(:description),
          "min" => definition[:min],
          "max" => definition[:max],
          "allow_nil" => definition.fetch(:allow_nil, false)
        }
      end
    end

    private

    def cache_key(key)
      "#{CACHE_PREFIX}/#{key}"
    end

    def load_payload(key)
      row = AppSetting.find_by(key: key.to_s)
      if row
        { override: true, value: row.value }
      else
        { override: false }
      end
    end

    def coerce(value, definition)
      return nil if value.nil? && definition.fetch(:allow_nil, false)

      case definition.fetch(:type)
      when :integer then Integer(value)
      when :float then Float(value)
      when :boolean then ActiveModel::Type::Boolean.new.cast(value)
      when :string then value.to_s
      when :array then Array(value)
      when :object then value.respond_to?(:to_h) ? value.to_h : value
      else value
      end
    end
  end
end
