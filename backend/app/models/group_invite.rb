class GroupInvite < ApplicationRecord
  belongs_to :conversation
  belongs_to :created_by_account, class_name: "Account", inverse_of: :created_group_invites

  has_many :join_requests, dependent: :nullify

  validates :token, presence: true, uniqueness: true
  validates :uses_count, numericality: { greater_than_or_equal_to: 0 }
end
