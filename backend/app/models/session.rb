# One issued JWT (SCHEMA §12.10 / NR-44). `jti` is the per-token revocation
# handle; `users.credentials_epoch` remains the blunt all-device instrument.
class Session < ApplicationRecord
  belongs_to :user, inverse_of: :sessions

  validates :jti, presence: true, uniqueness: true
  validates :last_seen_at, :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where(arel_table[:expires_at].gt(Time.current)) }

  def self.revoke_all_for!(user, except_jti: nil)
    relation = user.sessions.where(revoked_at: nil)
    relation = relation.where.not(jti: except_jti) if except_jti.present?
    jtis = relation.pluck(:jti)
    relation.update_all(revoked_at: Time.current)
    Auth::RevokedJtis.add(jtis)
  end

  def revoke!
    return if revoked?

    update!(revoked_at: Time.current)
    Auth::RevokedJtis.add(jti)
  end

  def revoked?
    revoked_at.present?
  end

  def expired?
    expires_at <= Time.current
  end

  def usable?
    !revoked? && !expired?
  end

  def touch_last_seen!
    granularity = Settings.fetch(:session_last_seen_granularity)
    return if last_seen_at.present? && last_seen_at > granularity.seconds.ago

    update_column(:last_seen_at, Time.current)
  end
end
