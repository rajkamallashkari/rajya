# The participant acting in conversations (CONVENTIONS.md §2.4) — every human
# `User` and every `Bot` has exactly one `Account`. Policies and messaging
# always key off this, never `User` directly.
class Account < ApplicationRecord
  KINDS = %w[human bot].freeze

  has_one :user, inverse_of: :account, dependent: :destroy
  has_one :bot, inverse_of: :account, dependent: :destroy
  has_one :storage_quota, inverse_of: :account, dependent: :destroy
  has_one :preference, inverse_of: :account, dependent: :destroy

  has_many :conversation_memberships, dependent: :destroy
  has_many :conversations, through: :conversation_memberships
  has_many :sent_messages, class_name: "Message", foreign_key: :sender_account_id, inverse_of: :sender_account,
                            dependent: :nullify
  has_many :reactions, dependent: :destroy
  has_many :saved_messages, dependent: :destroy
  has_many :pinned_messages, foreign_key: :pinned_by_account_id, inverse_of: :pinned_by_account, dependent: :destroy
  has_many :blocks_initiated, class_name: "Block", foreign_key: :blocker_account_id, inverse_of: :blocker_account,
                               dependent: :destroy
  has_many :blocks_received, class_name: "Block", foreign_key: :blocked_account_id, inverse_of: :blocked_account,
                              dependent: :destroy
  has_many :conversation_folders, dependent: :destroy
  has_many :call_participants, dependent: :destroy
  has_many :created_group_invites, class_name: "GroupInvite", foreign_key: :created_by_account_id,
                                    inverse_of: :created_by_account, dependent: :destroy
  has_many :join_requests, dependent: :destroy
  has_many :requested_bots, class_name: "BotRequest", foreign_key: :requester_account_id,
                             inverse_of: :requester_account, dependent: :destroy

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :username, presence: true, uniqueness: true
  validates :display_name, presence: true
end
