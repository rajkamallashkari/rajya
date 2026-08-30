module Presence
  class RecordLastActiveJob < ApplicationJob
    queue_as :background

    def perform(account_id)
      RecordLastActive.call(account_id: account_id)
    end
  end
end
