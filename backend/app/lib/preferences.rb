# SCHEMA_DESIGN.md §7 — one validated JSONB document per account. The registry
# is the source of truth for keys, types, ranges and defaults so a new
# preference is one line (no migration, no serializer change).
module Preferences
  class << self
    def define(&)
      Registry.define(&)
    end

    def defaults
      Document.defaults
    end

    def materialize(stored)
      Document.materialize(stored)
    end

    def apply(stored, patch)
      Document.apply(stored, patch)
    end

    def registry_payload
      Registry.payload
    end

    def typescript
      Registry.typescript
    end
  end
end
