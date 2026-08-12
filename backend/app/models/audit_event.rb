class AuditEvent < ApplicationRecord
  belongs_to :admin_user, class_name: "User", optional: true
  belongs_to :impersonated_account, class_name: "Account", optional: true

  validates :action, presence: true
end
