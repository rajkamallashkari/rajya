class CreateReports < ActiveRecord::Migration[8.0]
  def change
    create_table :reports do |t|
      t.bigint :reporter_account_id, null: false
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.string :reason, null: false
      t.text :details
      t.string :status, null: false, default: "pending"
      t.bigint :reviewed_by_user_id
      t.datetime :reviewed_at
      t.text :resolution_note

      t.timestamps

      t.index [ :status, :created_at ], name: "idx_reports_status_created"
      t.index [ :reporter_account_id, :subject_type, :subject_id ],
              unique: true, where: "status = 'pending'", name: "idx_reports_open_unique"
      t.check_constraint "subject_type IN ('message', 'account', 'conversation', 'bot')",
                         name: "ck_reports_subject_type"
      t.check_constraint "status IN ('pending', 'reviewing', 'actioned', 'dismissed')",
                         name: "ck_reports_status"
    end

    add_foreign_key :reports, :accounts, column: :reporter_account_id, on_delete: :cascade
    add_foreign_key :reports, :users, column: :reviewed_by_user_id, on_delete: :nullify
  end
end
