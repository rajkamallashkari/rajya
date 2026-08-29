# SCHEMA_DESIGN.md §12.10 / §12.12 — per-token session rows (NR-44 / S-20)
# and owner-private contact nicknames (NR-41 / S-22).
class CreateSessionsAndContactNicknames < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.bigint :user_id, null: false
      t.uuid :jti, null: false
      t.text :device_label
      t.text :user_agent
      t.inet :ip
      t.datetime :last_seen_at, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.datetime :created_at, null: false

      t.index :jti, unique: true
      t.index :user_id, where: "revoked_at IS NULL", name: "index_sessions_on_user_id_active"
    end
    add_foreign_key :sessions, :users, on_delete: :cascade

    create_table :contact_nicknames do |t|
      t.bigint :owner_account_id, null: false
      t.bigint :target_account_id, null: false
      t.text :nickname, null: false

      t.timestamps

      t.index [ :owner_account_id, :target_account_id ], unique: true,
                                                        name: "idx_contact_nicknames_owner_target"

      t.check_constraint "owner_account_id <> target_account_id", name: "ck_contact_nicknames_not_self"
    end
    add_foreign_key :contact_nicknames, :accounts, column: :owner_account_id, on_delete: :cascade
    add_foreign_key :contact_nicknames, :accounts, column: :target_account_id, on_delete: :cascade
  end
end
