# Compatibility alias used in MASTER_PLAN.md P0 (`Flags.enabled?`). The
# canonical API is FeatureFlag.enabled? (CONVENTIONS.md §5).
module Flags
  def self.enabled?(key, account: nil)
    FeatureFlag.enabled?(key, account: account)
  end
end
