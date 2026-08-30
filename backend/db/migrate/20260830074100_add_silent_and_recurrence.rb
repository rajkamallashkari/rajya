class AddSilentAndRecurrence < ActiveRecord::Migration[8.0]
  def change
    add_column :messages, :silent, :boolean, null: false, default: false

    add_column :scheduled_messages, :recurrence_rule, :text
    add_column :scheduled_messages, :next_run_at, :datetime
    add_column :scheduled_messages, :last_run_at, :datetime
    add_column :scheduled_messages, :occurrences_sent, :integer, null: false, default: 0
    add_column :scheduled_messages, :ends_at, :datetime

    add_index :scheduled_messages, :next_run_at,
              where: "recurrence_rule IS NOT NULL",
              name: "idx_scheduled_messages_next_run"
    add_check_constraint :scheduled_messages, "occurrences_sent >= 0",
                         name: "ck_scheduled_messages_occurrences_sent"
  end
end
