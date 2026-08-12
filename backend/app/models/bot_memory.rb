# `embedding` is `vector(768)` (pgvector) — ActiveRecord type registration and
# nearest-neighbor query helpers land with the AI memory-recall feature, not
# this schema-skeleton session.
class BotMemory < ApplicationRecord
  belongs_to :bot
  belongs_to :source_account, class_name: "Account", optional: true
  belongs_to :source_message, class_name: "Message", optional: true

  validates :content, presence: true
  validates :importance, numericality: true
end
