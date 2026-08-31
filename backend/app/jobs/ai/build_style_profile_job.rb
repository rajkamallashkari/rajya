module Ai
  class BuildStyleProfileJob < ApplicationJob
    queue_as :default
    discard_on ActiveJob::DeserializationError

    def perform(account_id, force = false)
      account = Account.find_by(id: account_id)
      return if account.nil?

      StyleProfiles::Build.call(account: account, force: force)
    end
  end
end
