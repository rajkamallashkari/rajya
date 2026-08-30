# Keyed directly by `account_id` (SCHEMA_DESIGN.md §6) — one row per account,
# no surrogate id. `table_name` is explicit because Rails' default inflector
# treats "quota" as an already-pluralized Latin "-tum" noun (like
# data/datum) and refuses to pluralize it to "storage_quotas".
class StorageQuota < ApplicationRecord
  self.table_name = "storage_quotas"
  self.primary_key = "account_id"

  belongs_to :account, inverse_of: :storage_quota

  validates :quota_bytes, numericality: { greater_than: 0 }
  validates :used_bytes, numericality: { greater_than_or_equal_to: 0 }

  def self.ensure_for!(account)
    find_or_create_by!(account_id: account.id) do |row|
      row.quota_bytes = Settings.fetch(:user_quota_bytes)
      row.used_bytes = 0
    end
  end

  def can_upload?(byte_size)
    used_bytes + byte_size.to_i <= quota_bytes
  end
end
