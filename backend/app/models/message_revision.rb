class MessageRevision < ApplicationRecord
  belongs_to :message

  validates :body, presence: true
  validates :superseded_at, presence: true
end
