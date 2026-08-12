class Reaction < ApplicationRecord
  belongs_to :message
  belongs_to :account

  validates :emoji, presence: true, uniqueness: { scope: %i[message_id account_id] }
end
