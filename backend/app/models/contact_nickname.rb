# How the owner refers to a contact (SCHEMA §12.12 / NR-41). Global per
# target account, private to the owner, never serialized to anyone else (S-22).
class ContactNickname < ApplicationRecord
  belongs_to :owner_account, class_name: "Account", inverse_of: :owned_nicknames
  belongs_to :target_account, class_name: "Account", inverse_of: :received_nicknames

  validates :nickname, presence: true
  validates :target_account_id, uniqueness: { scope: :owner_account_id }
  validate :not_self
  validate :nickname_length

  private

  def not_self
    return if owner_account_id.blank? || target_account_id.blank?
    return if owner_account_id != target_account_id

    errors.add(:target_account_id, Catalog.t("errors.models.contact_nickname.self"))
  end

  def nickname_length
    return if nickname.blank?

    max = Settings.fetch(:nickname_max_length)
    return if nickname.length <= max

    errors.add(:nickname, Catalog.t("errors.models.contact_nickname.too_long", count: max))
  end
end
