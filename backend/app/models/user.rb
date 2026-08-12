# The human who authenticated (CONVENTIONS.md §2.4) — admin, credentials, and
# impersonation audit key off this, never `Account` directly.
class User < ApplicationRecord
  belongs_to :account, inverse_of: :user

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

  validates :account_id, presence: true, uniqueness: true
  validates :credentials_epoch, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
