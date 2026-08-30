class PollOption < ApplicationRecord
  self.record_timestamps = false

  belongs_to :poll, inverse_of: :poll_options
  has_many :poll_votes, dependent: :destroy, inverse_of: :poll_option

  validates :label, presence: true
  validates :position, presence: true
end
