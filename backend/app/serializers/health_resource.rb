# Operational readiness payload (TARGET_ARCHITECTURE.md §4.9). Not a domain
# resource — still an Alba serializer so the controller does not assemble JSON.
class HealthResource < ApplicationResource
  attribute :status do
    object.ok? ? "ok" : "error"
  end

  attributes :checks
end
