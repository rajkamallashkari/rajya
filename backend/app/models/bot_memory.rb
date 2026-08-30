# `embedding` is `vector(768)` (pgvector). The OID is registered as text in
# `config/initializers/pgvector.rb` so SELECTs stay quiet. Neighbor recall is P9.3.
class BotMemory < ApplicationRecord
  belongs_to :bot
  belongs_to :source_account, class_name: "Account", optional: true
  belongs_to :source_message, class_name: "Message", optional: true

  validates :content, presence: true
  validates :importance, numericality: true
end
