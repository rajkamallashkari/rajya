module Polls
  module Counters
    module_function

    def refresh!(poll)
      counts = poll.poll_votes.group(:poll_option_id).count
      poll.poll_options.each do |option|
        option.update_column(:vote_count, counts[option.id] || 0)
      end
      poll.update_column(:voter_count, poll.poll_votes.distinct.count(:account_id))
    end
  end
end
