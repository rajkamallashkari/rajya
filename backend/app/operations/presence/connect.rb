module Presence
  class Connect < ApplicationOperation
    def call(account:)
      return failure(:forbidden) unless account.human?

      count = Counter.increment(account.id)
      Announce.call(account: account, online: true) if count == 1
      RecordLastActiveJob.perform_later(account.id)
      success(count)
    end
  end
end
