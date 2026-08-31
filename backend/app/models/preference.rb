# Keyed directly by `account_id` (SCHEMA_DESIGN.md §7) — settings live in the
# `data` JSONB registry, never as new columns.
class Preference < ApplicationRecord
  self.primary_key = "account_id"

  belongs_to :account, inverse_of: :preference

  def privacy(key)
    Preferences::Document.dig(data, "privacy", key)
  end

  def style_profile_enabled?
    ActiveModel::Type::Boolean.new.cast(Preferences::Document.dig(data, "ai", "style_profile_enabled"))
  end

  def style_profile
    stored = data.is_a?(Hash) ? data.dig("ai", "style_profile") : nil
    stored
  end

  def style_profile_updated_at
    stored = data.is_a?(Hash) ? data.dig("ai", "style_profile_updated_at") : nil
    stored
  end

  def merge_ai!(attrs)
    payload = data.is_a?(Hash) ? data.deep_dup : {}
    payload["ai"] ||= {}
    attrs.each { |key, value| payload["ai"][key.to_s] = value }
    update!(data: payload)
  end

  def timezone
    Preferences::Document.dig(data, "locale", "timezone")
  end

  def self.privacy_default(key)
    Preferences.defaults.dig("privacy", key.to_s)
  end
end
