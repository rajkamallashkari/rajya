class PollVote < ApplicationRecord
  self.record_timestamps = false

  belongs_to :poll, inverse_of: :poll_votes
  belongs_to :poll_option, inverse_of: :poll_votes
  belongs_to :account

  before_create :stamp_created_at

  private

  def stamp_created_at
    self.created_at ||= Time.current
  end
end
