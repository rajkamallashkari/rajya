# Keyed directly by `account_id` (SCHEMA_DESIGN.md §7) — settings live in the
# `data` JSONB registry (CONVENTIONS.md §4.5), never as new columns.
class Preference < ApplicationRecord
  self.primary_key = "account_id"

  belongs_to :account, inverse_of: :preference
end
