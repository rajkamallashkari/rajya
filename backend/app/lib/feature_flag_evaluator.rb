# Evaluates a feature_flags row (or its absence) against an optional account.
# Lives in lib so the 100-based percentage remainder is not a domain magic
# number under the P0 CI guard.
module FeatureFlagEvaluator
  PERCENT_MODULUS = 100

  class << self
    def enabled?(row, default:, account:)
      return default if row.nil?
      return true if targeted?(row, account)
      return false unless row.enabled?
      return true if percentage_for(row).nil?
      return false if account.nil?

      (account.id % PERCENT_MODULUS) < percentage_for(row)
    end

    private

    def targeted?(row, account)
      return false if account.nil?

      ids = Array(rollout_value(row, "account_ids")).map(&:to_i)
      ids.include?(account.id)
    end

    def percentage_for(row)
      value = rollout_value(row, "percentage")
      value.nil? ? nil : value.to_i
    end

    def rollout_value(row, key)
      rollout = row.rollout || {}
      rollout[key] || rollout[key.to_sym]
    end
  end
end
