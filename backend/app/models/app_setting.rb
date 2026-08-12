# Tier 1 tunable constants registry (CONVENTIONS.md §5) — code-defined
# defaults, DB overrides, read via `Settings.fetch(:key)`. Keyed directly by
# `key`, no surrogate id.
class AppSetting < ApplicationRecord
  self.primary_key = "key"

  belongs_to :updated_by_user, class_name: "User", optional: true

  validates :key, presence: true
  validates :category, presence: true
end
