class MessageRevision < ApplicationRecord
  belongs_to :message

  validates :body, exclusion: { in: [ nil ] }
  validates :superseded_at, presence: true
end
