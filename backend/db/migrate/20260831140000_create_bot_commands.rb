class CreateBotCommands < ActiveRecord::Migration[8.1]
  def change
    create_table :bot_commands do |t|
      t.bigint :bot_id, null: false
      t.citext :name, null: false
      t.text :description, null: false
      t.text :usage_hint
      t.integer :position, null: false, default: 0, limit: 2
    end

    add_index :bot_commands, [ :bot_id, :name ], unique: true, name: "idx_bot_commands_bot_name"
    add_foreign_key :bot_commands, :bots, on_delete: :cascade
    add_check_constraint :bot_commands, "name ~ '^[a-z0-9_]{1,32}$'", name: "ck_bot_commands_name"
  end
end
