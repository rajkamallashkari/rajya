module Presence
  class PersistOfflineJob < ApplicationJob
    queue_as :background

    def perform(account_id)
      PersistOffline.call(account_id: account_id)
    end
  end
end
