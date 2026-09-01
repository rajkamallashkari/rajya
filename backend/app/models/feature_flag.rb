# Admin-toggleable flags with targeted rollout (SCHEMA_DESIGN.md §12.15).
# Read via FeatureFlag.enabled?(:key, account:) — code-defined defaults, DB
# overrides, cache invalidated on write (CONVENTIONS.md §5).
class FeatureFlag < ApplicationRecord
  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :key, presence: true, uniqueness: true
  validates :description, presence: true

  after_commit { self.class.invalidate(key) }

  class << self
    def enabled?(key, account: nil)
      key = key.to_sym
      unless FeatureFlagRegistry.registered?(key)
        raise FeatureFlagRegistry::UnregisteredKey, key.to_s if Rails.env.local?

        return false
      end

      FeatureFlagEvaluator.enabled?(
        cached_row(key),
        default: FeatureFlagRegistry.default_for(key),
        account: account
      )
    end

    def invalidate(key)
      Rails.cache.delete(cache_key(key))
    end

    def unregistered_keys
      FeatureFlagRegistry.unregistered_keys
    end

    def listed
      rows = where(key: FeatureFlagRegistry.keys.map(&:to_s)).index_by { |row| row.key.to_s }
      FeatureFlagRegistry.keys.map do |key|
        row = rows[key.to_s]
        {
          "key" => key.to_s,
          "description" => FeatureFlagRegistry.description_for(key),
          "default" => FeatureFlagRegistry.default_for(key),
          "enabled" => row.nil? ? FeatureFlagRegistry.default_for(key) : row.enabled?,
          "overridden" => row.present?,
          "rollout" => row&.rollout || {}
        }
      end
    end

    private

    def cache_key(key)
      "rajya/flags/#{key}"
    end

    def cached_row(key)
      Rails.cache.fetch(cache_key(key)) { find_by(key: key.to_s) }
    end
  end
end
