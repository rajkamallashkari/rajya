module Polls
  class Show < ApplicationOperation
    def call(poll:)
      return failure(:not_found) if poll.message.deleted?

      poll.poll_options.load
      poll.poll_votes.includes(:account).load
      success(poll)
    end
  end
end
