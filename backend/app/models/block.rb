class Block < ApplicationRecord
  belongs_to :blocker_account, class_name: "Account", inverse_of: :blocks_initiated
  belongs_to :blocked_account, class_name: "Account", inverse_of: :blocks_received

  validates :blocked_account_id, uniqueness: { scope: :blocker_account_id }
  validate :not_self_block

  def self.between(account_id, other_id)
    where(blocker_account_id: account_id, blocked_account_id: other_id)
      .or(where(blocker_account_id: other_id, blocked_account_id: account_id))
  end

  private

  def not_self_block
    return if blocker_account_id.blank? || blocked_account_id.blank?
    return if blocker_account_id != blocked_account_id

    errors.add(:blocked_account_id, Catalog.t("errors.models.block.self"))
  end
end
