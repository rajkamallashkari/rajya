class CreateMessageChildren < ActiveRecord::Migration[8.0]
  def change
    create_table :polls do |t|
      t.bigint :message_id, null: false
      t.text :question, null: false
      t.boolean :allows_multiple, null: false, default: false
      t.boolean :is_anonymous, null: false, default: false
      t.datetime :closes_at
      t.datetime :closed_at
      t.integer :voter_count, null: false, default: 0

      t.timestamps

      t.index :message_id, unique: true
    end
    add_foreign_key :polls, :messages, on_delete: :cascade

    create_table :poll_options do |t|
      t.bigint :poll_id, null: false
      t.integer :position, null: false, limit: 2
      t.text :label, null: false
      t.integer :vote_count, null: false, default: 0

      t.index [ :poll_id, :position ], unique: true, name: "idx_poll_options_position"
    end
    add_foreign_key :poll_options, :polls, on_delete: :cascade

    create_table :poll_votes do |t|
      t.bigint :poll_id, null: false
      t.bigint :poll_option_id, null: false
      t.bigint :account_id, null: false
      t.datetime :created_at, null: false

      t.index [ :poll_option_id, :account_id ], unique: true, name: "idx_poll_votes_option_account"
      t.index [ :poll_id, :account_id ], name: "idx_poll_votes_poll_account"
    end
    add_foreign_key :poll_votes, :polls, on_delete: :cascade
    add_foreign_key :poll_votes, :poll_options, on_delete: :cascade
    add_foreign_key :poll_votes, :accounts, on_delete: :cascade

    create_table :message_locations do |t|
      t.bigint :message_id, null: false
      t.decimal :latitude, precision: 9, scale: 6, null: false
      t.decimal :longitude, precision: 9, scale: 6, null: false
      t.integer :accuracy_m
      t.text :label
      t.datetime :created_at, null: false

      t.index :message_id, unique: true
    end
    add_foreign_key :message_locations, :messages, on_delete: :cascade
    add_check_constraint :message_locations, "latitude BETWEEN -90 AND 90",
                         name: "ck_message_locations_latitude"
    add_check_constraint :message_locations, "longitude BETWEEN -180 AND 180",
                         name: "ck_message_locations_longitude"

    create_table :message_contacts do |t|
      t.bigint :message_id, null: false
      t.bigint :contact_account_id
      t.text :display_name, null: false
      t.text :phone
      t.citext :email
      t.integer :position, null: false, default: 0, limit: 2

      t.index [ :message_id, :position ], unique: true, name: "idx_message_contacts_position"
    end
    add_foreign_key :message_contacts, :messages, on_delete: :cascade
    add_foreign_key :message_contacts, :accounts, column: :contact_account_id, on_delete: :nullify
  end
end
