class AddPersonalOrganization < ActiveRecord::Migration[8.0]
  def change
    add_column :conversation_memberships, :pinned_at, :datetime
    add_column :conversation_memberships, :manually_unread_at, :datetime
    add_index :conversation_memberships, [ :account_id, :pinned_at ],
              order: { pinned_at: :desc },
              where: "pinned_at IS NOT NULL",
              name: "idx_memberships_pinned"

    create_table :message_reminders do |t|
      t.bigint :account_id, null: false
      t.bigint :message_id, null: false
      t.datetime :remind_at, null: false
      t.text :note
      t.datetime :completed_at
      t.timestamps
    end
    add_index :message_reminders, [ :account_id, :message_id ], unique: true,
              name: "idx_message_reminders_unique"
    add_index :message_reminders, :remind_at, where: "completed_at IS NULL",
              name: "idx_message_reminders_due"
    add_foreign_key :message_reminders, :accounts, on_delete: :cascade
    add_foreign_key :message_reminders, :messages, on_delete: :cascade

    create_table :saved_replies do |t|
      t.bigint :account_id, null: false
      t.citext :shortcut, null: false
      t.text :body, null: false
      t.integer :position, null: false, default: 0, limit: 2
      t.timestamps
    end
    add_index :saved_replies, [ :account_id, :shortcut ], unique: true, name: "idx_saved_replies_shortcut"
    add_foreign_key :saved_replies, :accounts, on_delete: :cascade
    add_check_constraint :saved_replies, "position >= 0", name: "ck_saved_replies_position"

    add_index :messages, [ :conversation_id, :sender_account_id, :position ],
              order: { position: :desc },
              name: "idx_messages_conversation_sender_position"
  end
end
