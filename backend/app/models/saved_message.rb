class SavedMessage < ApplicationRecord
  belongs_to :account
  belongs_to :message

  validates :message_id, uniqueness: { scope: :account_id }
end
