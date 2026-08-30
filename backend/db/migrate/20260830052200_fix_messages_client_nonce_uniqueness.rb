# SCHEMA_DESIGN.md §4 / F-3: idempotency is per conversation, not global.
# The P0 index unique'd client_nonce alone; two conversations may reuse a nonce.
class FixMessagesClientNonceUniqueness < ActiveRecord::Migration[8.1]
  def change
    remove_index :messages, name: "idx_messages_client_nonce_unique"
    add_index :messages, [ :conversation_id, :client_nonce ],
              unique: true,
              where: "client_nonce IS NOT NULL",
              name: "idx_messages_client_nonce_unique"
  end
end
