class AdminAuditEventListResource < ApplicationResource
  attribute :audit_events do
    object.audit_events.map { |event| AdminAuditEventResource.new(event).to_h }
  end
end
