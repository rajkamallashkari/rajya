module Search
  class People < ApplicationOperation
    def call(account:, query:)
      success(Search::AccountPayload.new(accounts: Search::AccountHits.call(account: account, query: query)))
    end
  end
end
