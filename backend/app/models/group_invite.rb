class GroupInvite < ApplicationRecord
  belongs_to :conversation
  belongs_to :created_by_account, class_name: "Account", inverse_of: :created_group_invites

  has_many :join_requests, dependent: :nullify

  before_validation :generate_token, on: :create

  validates :token, presence: true, uniqueness: true
  validates :uses_count, numericality: { greater_than_or_equal_to: 0 }

  def usable?
    return false if expires_at.present? && expires_at <= Time.current
    return false if max_uses.present? && uses_count >= max_uses

    true
  end

  # Atomic max-uses redemption (F-14). Zero rows means the invite is spent or expired.
  def self.redeem!(id)
    now = Time.current
    # SQL predicates — not user-facing copy.
    # rubocop:disable Rajya/NoUserFacingStrings
    where(id: id)
      .where("max_uses IS NULL OR uses_count < max_uses")
      .where("expires_at IS NULL OR expires_at > ?", now)
      .update_all("uses_count = uses_count + 1") == 1
    # rubocop:enable Rajya/NoUserFacingStrings
  end

  private

  def generate_token
    return if token.present?

    loop do
      self.token = SecureRandom.urlsafe_base64(Settings.fetch(:invite_token_bytes))
      break unless self.class.exists?(token: token)
    end
  end
end
