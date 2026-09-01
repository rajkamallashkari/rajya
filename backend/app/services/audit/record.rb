# Writes an audit_events row before a sensitive admin or impersonated action
# (TARGET §7.3 / D-2). Callers invoke this first so a later raise still leaves
# a trail. Observability, not a permission gate.
module Audit
  class Record
    def self.call(admin:, action:, impersonated_account: nil, target: nil, metadata: {}, ip: nil)
      AuditEvent.create!(
        admin_user: admin,
        impersonated_account: impersonated_account,
        action: action,
        target_type: target&.class&.name,
        target_id: target&.id,
        metadata: metadata,
        ip_address: ip
      )
    end
  end
end
