class Poll < ApplicationRecord
  belongs_to :message
  has_many :poll_options, -> { order(:position) }, dependent: :destroy, inverse_of: :poll
  has_many :poll_votes, dependent: :destroy, inverse_of: :poll

  validates :question, presence: true

  def closed?
    return true if closed_at.present?
    return false if closes_at.blank?

    closes_at <= Time.current
  end
end
