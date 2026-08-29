# The human who authenticated (CONVENTIONS.md §2.4) — admin, credentials, and
# impersonation audit key off this, never `Account` directly.
class User < ApplicationRecord
  has_secure_password validations: false

  belongs_to :account, inverse_of: :user

  has_many :sessions, dependent: :destroy
  has_many :verification_codes, dependent: :destroy
  has_many :passkeys, dependent: :destroy
  has_many :phone_verification_requests, dependent: :destroy
  has_many :web_push_subscriptions, dependent: :destroy
  has_many :updated_app_settings, class_name: "AppSetting", foreign_key: :updated_by_user_id,
                                   inverse_of: :updated_by_user, dependent: :nullify
  has_many :updated_translation_strings, class_name: "TranslationString", foreign_key: :updated_by_user_id,
                                          inverse_of: :updated_by_user, dependent: :nullify
  has_many :updated_prompt_templates, class_name: "PromptTemplate", foreign_key: :updated_by_user_id,
                                       inverse_of: :updated_by_user, dependent: :nullify
  has_many :admin_audit_events, class_name: "AuditEvent", foreign_key: :admin_user_id, inverse_of: :admin_user,
                                 dependent: :nullify

  validates :account_id, uniqueness: { allow_nil: true }
  validates :credentials_epoch, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :email, uniqueness: { case_sensitive: false, allow_nil: true }
  validates :phone, uniqueness: { allow_nil: true }
  validates :google_subject, uniqueness: { allow_nil: true }
  validates :webauthn_handle, uniqueness: { allow_nil: true }
  validate :account_must_be_human

  def revoke_all_credentials!
    transaction do
      increment!(:credentials_epoch)
      Session.revoke_all_for!(self)
    end
  end

  # BR-43: always persist last-active. Privacy flags gate exposure only.
  def record_last_active!(at: Time.current)
    update!(last_active_at: at)
  end

  private

  def account_must_be_human
    return if account.blank? || account.human?

    errors.add(:account, Catalog.t("errors.models.user.account_kind"))
  end
end
