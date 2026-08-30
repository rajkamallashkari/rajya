class AddTranscriptsAndExportJobs < ActiveRecord::Migration[8.1]
  def change
    add_column :attachments, :transcript, :text
    add_column :attachments, :transcript_status, :string
    add_column :attachments, :transcript_language, :string
    add_check_constraint :attachments,
                         "transcript_status IS NULL OR transcript_status IN ('pending', 'ready', 'failed')",
                         name: "ck_attachments_transcript_status"

    create_table :export_jobs do |t|
      t.bigint :account_id, null: false
      t.bigint :conversation_id
      t.string :format, null: false
      t.boolean :include_media, null: false, default: false
      t.string :status, null: false, default: "pending"
      t.bigint :blob_id
      t.string :error_message
      t.datetime :expires_at, null: false
      t.timestamps
    end

    add_index :export_jobs, :account_id
    add_index :export_jobs, :conversation_id
    add_index :export_jobs, :blob_id
    add_index :export_jobs, :expires_at
    add_check_constraint :export_jobs, "format IN ('json', 'txt', 'html')", name: "ck_export_jobs_format"
    add_check_constraint :export_jobs,
                         "status IN ('pending', 'processing', 'ready', 'failed')",
                         name: "ck_export_jobs_status"
    add_foreign_key :export_jobs, :accounts, on_delete: :cascade
    add_foreign_key :export_jobs, :conversations, on_delete: :cascade
    add_foreign_key :export_jobs, :active_storage_blobs, column: :blob_id, on_delete: :nullify
  end
end
