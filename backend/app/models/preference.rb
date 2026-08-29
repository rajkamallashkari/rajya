# Keyed directly by `account_id` (SCHEMA_DESIGN.md §7) — settings live in the
# `data` JSONB registry (CONVENTIONS.md §4.5), never as new columns.
class Preference < ApplicationRecord
  self.primary_key = "account_id"

  # SCHEMA_DESIGN.md §7 privacy object — also the discoverability source of
  # truth (BR-45…47). Missing keys fall back to these defaults so a row of
  # `{}` is equivalent to the documented document.
  PRIVACY_DEFAULTS = {
    "read_receipts" => true,
    "last_active" => true,
    "discoverable_by_username" => true,
    "discoverable_by_email" => false,
    "discoverable_by_phone" => false,
    "show_email_on_profile" => false,
    "show_phone_on_profile" => false
  }.freeze

  belongs_to :account, inverse_of: :preference

  def privacy(key)
    stored = data.is_a?(Hash) ? data.dig("privacy", key.to_s) : nil
    stored.nil? ? self.class.privacy_default(key) : stored
  end

  def self.privacy_default(key)
    PRIVACY_DEFAULTS.fetch(key.to_s)
  end
end
