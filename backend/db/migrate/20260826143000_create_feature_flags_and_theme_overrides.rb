# SCHEMA_DESIGN.md §12.15 — the two Tier 1 tables that complete the config
# stack (session 0.3). `app_settings` / `translation_strings` / `prompt_templates`
# already exist from the P0 schema migration.
class CreateFeatureFlagsAndThemeOverrides < ActiveRecord::Migration[8.1]
  def change
    create_table :feature_flags do |t|
      t.citext :key, null: false
      t.text :description, null: false
      t.boolean :enabled, null: false, default: false
      t.jsonb :rollout, null: false, default: {}
      t.bigint :updated_by_user_id

      t.timestamps

      t.index :key, unique: true
    end
    add_foreign_key :feature_flags, :users, column: :updated_by_user_id, on_delete: :nullify

    create_table :theme_overrides do |t|
      t.string :theme, null: false
      t.string :token_name, null: false
      t.string :value, null: false
      t.bigint :updated_by_user_id

      t.timestamps

      t.index [ :theme, :token_name ], unique: true

      t.check_constraint "theme IN ('light', 'dark')", name: "ck_theme_overrides_theme"
    end
    add_foreign_key :theme_overrides, :users, column: :updated_by_user_id, on_delete: :nullify
  end
end
