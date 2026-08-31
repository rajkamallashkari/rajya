class Bot < ApplicationRecord
  belongs_to :account, inverse_of: :bot
  belongs_to :owner_account, class_name: "Account", optional: true

  has_many :bot_commands, dependent: :destroy
  has_many :bot_memories, dependent: :destroy
  has_many :created_requests, class_name: "BotRequest", foreign_key: :bot_id, inverse_of: :bot, dependent: :destroy
  has_many :requests_targeting_self, class_name: "BotRequest", foreign_key: :target_bot_id, inverse_of: :target_bot,
                                      dependent: :destroy

  validates :account_id, uniqueness: { allow_nil: true }
  validates :persona_prompt, presence: true
  validate :account_must_be_bot

  scope :active, -> { joins(:account).merge(Account.active) }
  scope :system, -> { where(owner_account_id: nil) }

  def deactivate!
    account.update!(deactivated_at: Time.current)
  end

  def deactivated?
    account.deactivated?
  end

  private

  def account_must_be_bot
    return if account.blank? || account.bot?

    errors.add(:account, Catalog.t("errors.models.bot.account_kind"))
  end
end
