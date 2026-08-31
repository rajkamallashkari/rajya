class AddSearchFilterIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :messages, [ :conversation_id, :created_at ],
              name: "idx_messages_conversation_created"
    add_index :messages, [ :conversation_id, :kind, :created_at ],
              order: { created_at: :desc },
              name: "idx_messages_conversation_kind_created"
    add_index :messages, [ :conversation_id, :created_at ],
              order: { created_at: :desc },
              where: "attachment_count > 0",
              name: "idx_messages_has_attachment"
    add_index :messages, [ :conversation_id, :created_at ],
              order: { created_at: :desc },
              where: "body ~* 'https?://'",
              name: "idx_messages_has_link"
  end
end
