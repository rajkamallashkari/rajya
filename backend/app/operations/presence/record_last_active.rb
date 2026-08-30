module Presence
  class RecordLastActive < ApplicationOperation
    def call(account_id:, force: false)
      user = Account.find_by(id: account_id)&.user
      return success if user.nil?
      return success unless force || claim_write?(account_id)

      user.record_last_active!
      success(user)
    end

    private

    def claim_write?(account_id)
      Rails.cache.write(
        "last_active_write:#{account_id}",
        true,
        expires_in: Settings.fetch(:last_active_debounce).seconds,
        unless_exist: true
      )
    end
  end
end
