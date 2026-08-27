# Tier 1 tunable constants registry (CONVENTIONS.md §5) — code-defined
# defaults, DB overrides, read via `Settings.fetch(:key)`. Keyed directly by
# `key`, no surrogate id. Unregistered keys are persistable (an admin typo
# must not crash a write) but Settings.fetch ignores them.
class AppSetting < ApplicationRecord
  self.primary_key = "key"

  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :key, presence: true
  validates :category, presence: true
  validate :value_matches_registry, if: :registered?

  after_commit { Settings.invalidate(key) }

  private

  def registered?
    Settings::Registry.registered?(key)
  end

  def value_matches_registry
    definition = Settings::Registry.fetch(key.to_sym)
    return if definition.fetch(:allow_nil, false) && value.nil?

    coerced = Settings.send(:coerce, value, definition)
    min = definition[:min]
    max = definition[:max]
    errors.add(:value, Catalog.t("errors.models.app_setting.below_min")) if min && coerced.is_a?(Numeric) && coerced < min
    errors.add(:value, Catalog.t("errors.models.app_setting.above_max")) if max && coerced.is_a?(Numeric) && coerced > max
  rescue ArgumentError, TypeError
    errors.add(:value, Catalog.t("errors.models.app_setting.wrong_type"))
  end
end
