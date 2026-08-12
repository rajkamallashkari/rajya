class Bot < ApplicationRecord
  belongs_to :account, inverse_of: :bot
  belongs_to :owner_account, class_name: "Account", optional: true

  has_many :bot_memories, dependent: :destroy
  has_many :created_requests, class_name: "BotRequest", foreign_key: :bot_id, inverse_of: :bot, dependent: :destroy
  has_many :requests_targeting_self, class_name: "BotRequest", foreign_key: :target_bot_id, inverse_of: :target_bot,
                                      dependent: :destroy

  validates :account_id, presence: true, uniqueness: true
  validates :persona_prompt, presence: true
end
