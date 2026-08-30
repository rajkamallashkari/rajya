module Presence
  class Disconnect < ApplicationOperation
    def call(account:)
      count = Counter.decrement(account.id)
      if count.zero?
        PersistOfflineJob.set(wait: Settings.fetch(:presence_offline_grace).seconds)
                         .perform_later(account.id)
      end
      success(count)
    end
  end
end
