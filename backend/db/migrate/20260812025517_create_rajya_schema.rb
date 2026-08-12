# The entire target schema in one definition (CONVENTIONS.md §4, MASTER_PLAN.md
# P0): every table, FK, CHECK and index in SCHEMA_DESIGN.md §1–§9. Not 66
# migrations; one starting point. Ported from legacy/cognify/db/schema.rb —
# renames, the accounts/users/bots split, and the watermark read-state model
# are all per SCHEMA_DESIGN.md; nothing here reintroduces a forbidden legacy
# name (CONVENTIONS.md §2.9).
class CreateRajyaSchema < ActiveRecord::Migration[8.1]
  def change
    enable_extension "citext"
    enable_extension "pgcrypto" # gen_random_uuid() for client_nonce defaults
    enable_extension "vector"

    # ── §2 Identity ───────────────────────────────────────────────────────

    create_table :accounts do |t|
      t.string :kind, null: false
      t.citext :username, null: false
      t.string :display_name, null: false
      t.text :bio
      t.datetime :deactivated_at

      t.timestamps

      t.index :username, unique: true
      t.index :kind, where: "deactivated_at IS NULL"

      t.check_constraint "kind IN ('human', 'bot')", name: "ck_accounts_kind"
    end

    create_table :users do |t|
      t.bigint :account_id, null: false
      t.citext :email
      t.datetime :email_verified_at
      t.string :phone
      t.datetime :phone_verified_at
      t.string :password_digest
      t.string :google_subject
      t.string :webauthn_handle
      t.integer :credentials_epoch, null: false, default: 0
      t.boolean :is_admin, null: false, default: false
      t.datetime :onboarded_at
      t.datetime :last_active_at

      t.timestamps

      t.index :account_id, unique: true
      t.index :email, unique: true
      t.index :phone, unique: true, where: "phone IS NOT NULL"
      t.index :google_subject, unique: true
      t.index :webauthn_handle, unique: true
    end
    add_foreign_key :users, :accounts, on_delete: :cascade

    create_table :bots do |t|
      t.bigint :account_id, null: false
      t.bigint :owner_account_id
      t.text :persona_prompt, null: false
      t.boolean :memory_enabled, null: false, default: true
      t.string :model_override

      t.timestamps

      t.index :account_id, unique: true
      t.index :owner_account_id
    end
    add_foreign_key :bots, :accounts, on_delete: :cascade
    add_foreign_key :bots, :accounts, column: :owner_account_id, on_delete: :nullify

    create_table :verification_codes do |t|
      t.bigint :user_id, null: false
      t.string :purpose, null: false
      t.string :channel, null: false, default: "email"
      t.string :destination, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.integer :attempts, null: false, default: 0
      t.datetime :consumed_at
      t.datetime :created_at, null: false

      t.index [ :user_id, :purpose ], name: "idx_verification_codes_active", where: "consumed_at IS NULL"

      t.check_constraint "purpose IN ('login', 'signup', 'password_reset', 'email_change')",
                          name: "ck_verification_codes_purpose"
      t.check_constraint "channel = 'email'", name: "ck_verification_codes_channel"
    end
    add_foreign_key :verification_codes, :users, on_delete: :cascade

    create_table :passkeys do |t|
      t.bigint :user_id, null: false
      t.string :webauthn_credential_id, null: false
      t.string :public_key, null: false
      t.integer :sign_count, null: false, default: 0
      t.string :nickname
      t.datetime :last_used_at
      t.datetime :created_at, null: false

      t.index :webauthn_credential_id, unique: true
      t.index :user_id
    end
    add_foreign_key :passkeys, :users, on_delete: :cascade

    create_table :phone_verification_requests do |t|
      t.bigint :user_id, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.string :confirmed_phone
      t.datetime :confirmed_at
      t.datetime :created_at, null: false

      t.index :code_digest, name: "idx_phone_verif_requests_code_digest", unique: true, where: "confirmed_at IS NULL"
      t.index :user_id, name: "idx_phone_verif_requests_user_id", where: "confirmed_at IS NULL"
    end
    add_foreign_key :phone_verification_requests, :users, on_delete: :cascade

    create_table :blocks do |t|
      t.bigint :blocker_account_id, null: false
      t.bigint :blocked_account_id, null: false
      t.datetime :created_at, null: false

      t.index [ :blocker_account_id, :blocked_account_id ], unique: true, name: "idx_blocks_unique"
      t.index :blocked_account_id

      t.check_constraint "blocker_account_id <> blocked_account_id", name: "ck_blocks_not_self"
    end
    add_foreign_key :blocks, :accounts, column: :blocker_account_id, on_delete: :cascade
    add_foreign_key :blocks, :accounts, column: :blocked_account_id, on_delete: :cascade

    # ── §3 Conversations ──────────────────────────────────────────────────

    create_table :conversations do |t|
      t.string :kind, null: false
      t.string :title
      t.text :description
      t.string :direct_key
      t.bigint :last_message_id
      t.datetime :last_activity_at, null: false
      t.bigint :next_position, null: false, default: 0
      t.bigint :next_revision, null: false, default: 0
      t.text :context_summary
      t.bigint :summarized_through_message_id

      t.timestamps

      t.index :direct_key, unique: true
      t.index :last_activity_at, order: :desc

      t.check_constraint "kind IN ('direct', 'group', 'channel')", name: "ck_conversations_kind"
      t.check_constraint "(kind = 'direct') = (direct_key IS NOT NULL)",
                          name: "ck_conversations_direct_key_only_for_direct"
      t.check_constraint "kind = 'direct' OR title IS NOT NULL", name: "ck_conversations_groups_have_titles"
    end

    create_table :conversation_memberships do |t|
      t.bigint :conversation_id, null: false
      t.bigint :account_id, null: false
      t.string :role, null: false, default: "member"
      t.string :status, null: false, default: "active"
      t.bigint :invited_by_account_id
      t.datetime :joined_at, null: false
      t.datetime :muted_until
      t.datetime :archived_at

      # hot-path read state (SCHEMA_DESIGN.md §5)
      t.bigint :last_delivered_position, null: false, default: 0
      t.bigint :last_read_position, null: false, default: 0
      t.bigint :last_seen_position, null: false, default: 0
      t.datetime :last_delivered_at
      t.datetime :last_read_at
      t.integer :unread_count, null: false, default: 0

      t.timestamps

      t.index [ :conversation_id, :account_id ], unique: true, name: "idx_memberships_conversation_account"
      t.index [ :account_id, :status ], name: "idx_memberships_account_status"
      t.index :account_id, name: "idx_memberships_account_unarchived", where: "archived_at IS NULL"

      t.check_constraint "role IN ('member', 'admin', 'owner')", name: "ck_memberships_role"
      t.check_constraint "status IN ('active', 'left', 'removed')", name: "ck_memberships_status"
      t.check_constraint "last_seen_position >= last_read_position", name: "ck_memberships_seen_gte_read"
    end
    add_foreign_key :conversation_memberships, :conversations, on_delete: :cascade
    add_foreign_key :conversation_memberships, :accounts, on_delete: :cascade
    add_foreign_key :conversation_memberships, :accounts, column: :invited_by_account_id, on_delete: :nullify

    # ── §4 Messages ───────────────────────────────────────────────────────

    create_table :messages do |t|
      t.bigint :conversation_id, null: false
      t.bigint :sender_account_id
      t.bigint :position, null: false
      t.bigint :revision, null: false
      t.string :kind, null: false, default: "text"
      t.string :system_event
      t.text :body
      t.uuid :client_nonce
      t.bigint :reply_to_message_id
      t.bigint :forwarded_from_account_id
      t.integer :forward_count, null: false, default: 0
      t.integer :attachment_count, null: false, default: 0
      t.jsonb :reaction_summary, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.jsonb :sender_snapshot, null: false, default: {}
      t.datetime :edited_at
      t.datetime :deleted_at

      t.timestamps

      t.index [ :conversation_id, :position ], unique: true
      t.index [ :conversation_id, :revision ]
      t.index [ :conversation_id, :id ], order: { id: :desc }, name: "idx_messages_conversation_id_desc"
      t.index :client_nonce, unique: true, where: "client_nonce IS NOT NULL", name: "idx_messages_client_nonce_unique"
      t.index :sender_account_id

      t.check_constraint "kind IN ('text', 'system', 'image', 'video', 'audio', 'voice', 'file')",
                          name: "ck_messages_kind"
      t.check_constraint "(kind = 'system') = (system_event IS NOT NULL)", name: "ck_messages_system_event_iff_system"
      t.check_constraint "kind = 'system' OR sender_account_id IS NOT NULL OR sender_snapshot <> '{}'",
                          name: "ck_messages_sender_required_unless_system"
    end
    add_foreign_key :messages, :conversations, on_delete: :cascade
    add_foreign_key :messages, :accounts, column: :sender_account_id, on_delete: :nullify
    add_foreign_key :messages, :messages, column: :reply_to_message_id, on_delete: :nullify
    add_foreign_key :messages, :accounts, column: :forwarded_from_account_id, on_delete: :nullify

    # Generated full-text search column (SCHEMA_DESIGN.md §4.5) — not expressible
    # via the `create_table` DSL, hence the raw SQL.
    execute <<~SQL.squish
      ALTER TABLE messages ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', coalesce(body, ''))) STORED;
    SQL
    add_index :messages, :search_vector, using: :gin

    # Deferred FKs — conversations.last_message_id / summarized_through_message_id
    # reference messages, which could not exist until now.
    add_foreign_key :conversations, :messages, column: :last_message_id, on_delete: :nullify
    add_foreign_key :conversations, :messages, column: :summarized_through_message_id, on_delete: :nullify

    create_table :reactions do |t|
      t.bigint :message_id, null: false
      t.bigint :account_id, null: false
      t.string :emoji, null: false
      t.datetime :created_at, null: false

      t.index [ :message_id, :account_id, :emoji ], unique: true, name: "idx_reactions_unique"
      t.index :message_id
      t.index :account_id
    end
    add_foreign_key :reactions, :messages, on_delete: :cascade
    add_foreign_key :reactions, :accounts, on_delete: :cascade

    create_table :message_revisions do |t|
      t.bigint :message_id, null: false
      t.text :body, null: false
      t.datetime :superseded_at, null: false

      t.index :message_id
    end
    add_foreign_key :message_revisions, :messages, on_delete: :cascade

    create_table :saved_messages do |t|
      t.bigint :account_id, null: false
      t.bigint :message_id, null: false
      t.datetime :created_at, null: false

      t.index [ :account_id, :message_id ], unique: true, name: "idx_saved_messages_unique"
    end
    add_foreign_key :saved_messages, :accounts, on_delete: :cascade
    add_foreign_key :saved_messages, :messages, on_delete: :cascade

    create_table :pinned_messages do |t|
      t.bigint :conversation_id, null: false
      t.bigint :message_id, null: false
      t.bigint :pinned_by_account_id, null: false
      t.datetime :created_at, null: false

      t.index [ :conversation_id, :message_id ], unique: true, name: "idx_pinned_messages_unique"
    end
    add_foreign_key :pinned_messages, :conversations, on_delete: :cascade
    add_foreign_key :pinned_messages, :messages, on_delete: :cascade
    add_foreign_key :pinned_messages, :accounts, column: :pinned_by_account_id, on_delete: :cascade

    # ── §5 Read state ─────────────────────────────────────────────────────

    create_table :receipt_marks do |t|
      t.bigint :membership_id, null: false
      t.string :kind, null: false
      t.bigint :position, null: false
      t.datetime :occurred_at, null: false

      t.index [ :membership_id, :kind, :position ], unique: true, name: "idx_receipt_marks_unique"

      t.check_constraint "kind IN ('delivered', 'read')", name: "ck_receipt_marks_kind"
    end
    add_foreign_key :receipt_marks, :conversation_memberships, column: :membership_id, on_delete: :cascade

    # ── §6 Media and storage ──────────────────────────────────────────────

    create_table :storage_buckets do |t|
      t.string :service_name, null: false
      t.string :label
      t.string :status, null: false, default: "active"
      t.integer :priority, null: false, default: 0
      t.bigint :capacity_bytes, null: false, default: 9_999_999_999
      t.bigint :used_bytes, null: false, default: 0
      t.datetime :last_health_check_at

      t.timestamps

      t.index :service_name, unique: true
      t.index [ :status, :priority ]

      t.check_constraint "status IN ('active', 'full', 'failed', 'disabled')", name: "ck_storage_buckets_status"
      t.check_constraint "used_bytes >= 0", name: "ck_storage_buckets_used_bytes_non_negative"
      t.check_constraint "capacity_bytes > 0", name: "ck_storage_buckets_capacity_positive"
    end

    create_table :attachments do |t|
      t.bigint :message_id, null: false
      t.string :kind, null: false
      t.string :content_type, null: false
      t.bigint :byte_size, null: false
      t.string :checksum
      t.integer :width
      t.integer :height
      t.integer :duration_ms
      t.string :blurhash
      t.jsonb :waveform
      t.string :processing_status, null: false, default: "pending"
      t.string :processing_error
      t.bigint :storage_bucket_id

      t.timestamps

      t.index :message_id
      t.index :checksum
      t.index :kind

      t.check_constraint "kind IN ('image', 'video', 'audio', 'voice', 'file')", name: "ck_attachments_kind"
      t.check_constraint "processing_status IN ('pending', 'ready', 'failed')",
                          name: "ck_attachments_processing_status"
    end
    add_foreign_key :attachments, :messages, on_delete: :cascade
    add_foreign_key :attachments, :storage_buckets, on_delete: :nullify

    create_table :storage_quotas, id: false do |t|
      t.bigint :account_id, null: false
      t.bigint :quota_bytes, null: false, default: 524_288_000
      t.bigint :used_bytes, null: false, default: 0
      t.datetime :recomputed_at
      t.datetime :updated_at, null: false

      t.check_constraint "used_bytes >= 0", name: "ck_storage_quotas_used_bytes_non_negative"
    end
    execute "ALTER TABLE storage_quotas ADD PRIMARY KEY (account_id);"
    add_foreign_key :storage_quotas, :accounts, on_delete: :cascade

    # ── §7 Preferences ────────────────────────────────────────────────────

    create_table :preferences, id: false do |t|
      t.bigint :account_id, null: false
      t.jsonb :data, null: false, default: {}
      t.datetime :updated_at, null: false
    end
    execute "ALTER TABLE preferences ADD PRIMARY KEY (account_id);"
    add_foreign_key :preferences, :accounts, on_delete: :cascade

    # ── §8 Platform, admin, and AI ────────────────────────────────────────

    create_table :app_settings, id: false do |t|
      t.string :key, null: false
      t.jsonb :value, null: false
      t.string :category, null: false
      t.bigint :updated_by_user_id
      t.datetime :updated_at, null: false
    end
    execute "ALTER TABLE app_settings ADD PRIMARY KEY (key);"
    add_foreign_key :app_settings, :users, column: :updated_by_user_id, on_delete: :nullify

    create_table :translation_strings do |t|
      t.string :key, null: false
      t.string :locale, null: false, default: "en"
      t.text :value, null: false
      t.bigint :updated_by_user_id
      t.datetime :updated_at, null: false

      t.index [ :key, :locale ], unique: true
    end
    add_foreign_key :translation_strings, :users, column: :updated_by_user_id, on_delete: :nullify

    create_table :prompt_templates do |t|
      t.string :capability, null: false
      t.integer :version, null: false, default: 1
      t.text :template, null: false
      t.boolean :active, null: false, default: true
      t.bigint :updated_by_user_id
      t.datetime :updated_at, null: false

      t.index [ :capability, :version ], unique: true
    end
    add_foreign_key :prompt_templates, :users, column: :updated_by_user_id, on_delete: :nullify

    create_table :audit_events do |t|
      t.bigint :admin_user_id
      t.bigint :impersonated_account_id
      t.string :action, null: false
      t.string :target_type
      t.bigint :target_id
      t.jsonb :metadata, null: false, default: {}
      t.inet :ip_address
      t.datetime :created_at, null: false

      t.index [ :admin_user_id, :created_at ], order: { created_at: :desc }, name: "idx_audit_events_admin_user"
      t.index [ :impersonated_account_id, :created_at ], order: { created_at: :desc },
                                                          name: "idx_audit_events_impersonated_account"
    end
    add_foreign_key :audit_events, :users, column: :admin_user_id, on_delete: :nullify
    add_foreign_key :audit_events, :accounts, column: :impersonated_account_id, on_delete: :nullify

    create_table :bot_memories do |t|
      t.bigint :bot_id, null: false
      t.text :content, null: false
      t.bigint :source_account_id
      t.bigint :source_message_id
      t.column :embedding, "vector(768)"
      t.float :importance, null: false, default: 0.5
      t.datetime :last_recalled_at
      t.datetime :created_at, null: false

      t.index [ :bot_id, :created_at ], order: { created_at: :desc }, name: "idx_bot_memories_bot_created"
    end
    add_foreign_key :bot_memories, :bots, on_delete: :cascade
    add_foreign_key :bot_memories, :accounts, column: :source_account_id, on_delete: :nullify
    add_foreign_key :bot_memories, :messages, column: :source_message_id, on_delete: :nullify
    execute "CREATE INDEX idx_bot_memories_embedding_hnsw ON bot_memories USING hnsw (embedding vector_cosine_ops);"

    create_table :ai_usage_events do |t|
      t.bigint :account_id
      t.bigint :conversation_id
      t.string :capability, null: false
      t.string :provider, null: false
      t.string :model, null: false
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.integer :latency_ms
      t.string :status, null: false
      t.string :error_code
      t.datetime :created_at, null: false

      t.index :created_at, order: :desc
      t.index [ :capability, :created_at ], order: { created_at: :desc }, name: "idx_ai_usage_events_capability"

      t.check_constraint "status IN ('success', 'failed', 'fallback')", name: "ck_ai_usage_events_status"
    end
    add_foreign_key :ai_usage_events, :accounts, on_delete: :nullify
    add_foreign_key :ai_usage_events, :conversations, on_delete: :nullify

    create_table :calls do |t|
      t.bigint :conversation_id, null: false
      t.bigint :initiator_account_id, null: false
      t.string :kind, null: false
      t.string :status, null: false
      t.datetime :started_at
      t.datetime :ended_at
      t.integer :duration_seconds

      t.timestamps

      t.check_constraint "kind IN ('audio', 'video')", name: "ck_calls_kind"
      t.check_constraint "status IN ('ringing', 'active', 'ended', 'missed', 'declined')", name: "ck_calls_status"
    end
    add_foreign_key :calls, :conversations, on_delete: :cascade
    add_foreign_key :calls, :accounts, column: :initiator_account_id, on_delete: :cascade

    create_table :call_participants do |t|
      t.bigint :call_id, null: false
      t.bigint :account_id, null: false
      t.string :status, null: false
      t.datetime :joined_at
      t.datetime :left_at

      t.index [ :call_id, :account_id ], unique: true, name: "idx_call_participants_unique"
      t.index :account_id, unique: true, where: "status IN ('ringing', 'joined')",
                            name: "idx_call_participants_one_live_per_account"

      t.check_constraint "status IN ('invited', 'ringing', 'joined', 'left', 'declined', 'missed')",
                          name: "ck_call_participants_status"
    end
    add_foreign_key :call_participants, :calls, on_delete: :cascade
    add_foreign_key :call_participants, :accounts, on_delete: :cascade

    create_table :conversation_folders do |t|
      t.bigint :account_id, null: false
      t.string :name, null: false
      t.integer :position, null: false, default: 0

      t.timestamps

      t.index :account_id
    end
    add_foreign_key :conversation_folders, :accounts, on_delete: :cascade

    create_table :conversation_folder_entries do |t|
      t.bigint :folder_id, null: false
      t.bigint :conversation_id, null: false
      t.integer :position, null: false, default: 0

      t.index [ :folder_id, :conversation_id ], unique: true, name: "idx_folder_entries_unique"
      t.index :folder_id
      t.index :conversation_id
    end
    add_foreign_key :conversation_folder_entries, :conversation_folders, column: :folder_id, on_delete: :cascade
    add_foreign_key :conversation_folder_entries, :conversations, on_delete: :cascade

    create_table :scheduled_messages do |t|
      t.bigint :conversation_id, null: false
      t.bigint :sender_account_id, null: false
      t.bigint :reply_to_message_id
      t.uuid :client_nonce
      t.text :body, null: false
      t.datetime :scheduled_at, null: false

      t.timestamps

      t.index :conversation_id
      t.index :sender_account_id
      t.index :scheduled_at
      t.index :client_nonce, unique: true, where: "client_nonce IS NOT NULL",
                              name: "idx_scheduled_messages_client_nonce"
    end
    add_foreign_key :scheduled_messages, :conversations, on_delete: :cascade
    add_foreign_key :scheduled_messages, :accounts, column: :sender_account_id, on_delete: :cascade
    add_foreign_key :scheduled_messages, :messages, column: :reply_to_message_id, on_delete: :nullify

    create_table :link_previews do |t|
      t.citext :url, null: false
      t.string :title
      t.text :description
      t.string :site_name
      t.string :remote_image_url
      t.string :cached_image_key
      t.string :status, null: false, default: "pending"
      t.datetime :fetched_at

      t.timestamps

      t.index :url, unique: true

      t.check_constraint "status IN ('pending', 'ready', 'failed')", name: "ck_link_previews_status"
    end

    create_table :message_link_previews do |t|
      t.bigint :message_id, null: false
      t.bigint :link_preview_id, null: false

      t.index :link_preview_id
      t.index [ :message_id, :link_preview_id ], unique: true, name: "idx_message_link_previews_unique"
      t.index :message_id
    end
    add_foreign_key :message_link_previews, :messages, on_delete: :cascade
    add_foreign_key :message_link_previews, :link_previews, on_delete: :cascade

    create_table :group_invites do |t|
      t.bigint :conversation_id, null: false
      t.bigint :created_by_account_id, null: false
      t.string :token, null: false
      t.integer :max_uses
      t.integer :uses_count, null: false, default: 0
      t.boolean :requires_approval, null: false, default: false
      t.datetime :expires_at

      t.timestamps

      t.index :conversation_id
      t.index :token, unique: true
    end
    add_foreign_key :group_invites, :conversations, on_delete: :cascade
    add_foreign_key :group_invites, :accounts, column: :created_by_account_id, on_delete: :cascade

    create_table :join_requests do |t|
      t.bigint :conversation_id, null: false
      t.bigint :account_id, null: false
      t.bigint :group_invite_id
      t.string :status, null: false, default: "pending"
      t.bigint :reviewed_by_account_id
      t.datetime :reviewed_at

      t.timestamps

      t.index [ :conversation_id, :account_id ], unique: true, name: "idx_join_requests_unique"
      t.index :conversation_id
      t.index :account_id

      t.check_constraint "status IN ('pending', 'approved', 'rejected')", name: "ck_join_requests_status"
    end
    add_foreign_key :join_requests, :conversations, on_delete: :cascade
    add_foreign_key :join_requests, :accounts, on_delete: :cascade
    add_foreign_key :join_requests, :group_invites, on_delete: :nullify
    add_foreign_key :join_requests, :accounts, column: :reviewed_by_account_id, on_delete: :nullify

    create_table :bot_requests do |t|
      t.bigint :bot_id
      t.bigint :target_bot_id
      t.bigint :requester_account_id, null: false
      t.string :kind, null: false, default: "create"
      t.string :status, null: false, default: "pending"
      t.jsonb :payload, null: false, default: {}
      t.string :decline_reason

      t.timestamps

      t.index :bot_id
      t.index :target_bot_id
      t.index :requester_account_id
      t.index :kind
      t.index :status

      t.check_constraint "kind IN ('create', 'edit')", name: "ck_bot_requests_kind"
      t.check_constraint "status IN ('pending', 'approved', 'declined')", name: "ck_bot_requests_status"
    end
    add_foreign_key :bot_requests, :bots, on_delete: :nullify
    add_foreign_key :bot_requests, :bots, column: :target_bot_id, on_delete: :nullify
    add_foreign_key :bot_requests, :accounts, column: :requester_account_id, on_delete: :cascade

    create_table :font_configs do |t|
      t.string :name, null: false
      t.string :font_family_value, null: false
      t.string :google_font_url
      t.boolean :is_active, null: false, default: true
      t.integer :position

      t.timestamps

      t.index :name, unique: true
      t.index [ :is_active, :position ], name: "idx_font_configs_active_ordered"
    end

    create_table :global_accent_configs, id: :string do |t|
      t.string :label, null: false
      t.string :hex, null: false
      t.boolean :is_active, null: false, default: true
      t.boolean :is_dark_compatible, null: false, default: true
      t.boolean :is_light_compatible, null: false, default: true
      t.boolean :is_seasonal, null: false, default: false
      t.integer :position
      t.datetime :updated_at, null: false

      t.check_constraint "hex ~ '^#[0-9A-Fa-f]{6}$'", name: "ck_global_accent_configs_hex"
    end

    create_table :web_push_subscriptions do |t|
      t.bigint :user_id, null: false
      t.text :endpoint, null: false
      t.string :p256dh, null: false
      t.string :auth, null: false

      t.timestamps

      t.index :endpoint
      t.index [ :user_id, :endpoint ], unique: true, name: "idx_web_push_subs_user_endpoint"
    end
    add_foreign_key :web_push_subscriptions, :users, on_delete: :cascade
  end
end
