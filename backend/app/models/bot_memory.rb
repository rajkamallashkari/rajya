# `embedding` is `vector(768)` (pgvector). ActiveRecord maps the OID as text;
# cosine neighbor recall lives in Bots::RetrieveMemories (NR-11).
class BotMemory < ApplicationRecord
  belongs_to :bot
  belongs_to :source_account, class_name: "Account", optional: true
  belongs_to :source_message, class_name: "Message", optional: true

  validates :content, presence: true
  validates :importance, numericality: true
end
