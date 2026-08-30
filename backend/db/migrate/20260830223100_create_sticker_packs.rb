class CreateStickerPacks < ActiveRecord::Migration[8.0]
  def change
    create_table :sticker_packs do |t|
      t.citext :slug, null: false
      t.text :name, null: false
      t.string :kind, null: false
      t.bigint :owner_account_id
      t.datetime :published_at
      t.integer :position, null: false, default: 0

      t.timestamps

      t.index :slug, unique: true
      t.check_constraint "kind IN ('sticker','emoji')", name: "ck_sticker_packs_kind"
    end
    add_foreign_key :sticker_packs, :accounts, column: :owner_account_id, on_delete: :cascade

    create_table :stickers do |t|
      t.bigint :sticker_pack_id, null: false
      t.citext :shortcode, null: false
      t.bigint :blob_id, null: false
      t.integer :position, null: false, default: 0, limit: 2

      t.index [ :sticker_pack_id, :shortcode ], unique: true
      t.index :blob_id
    end
    add_foreign_key :stickers, :sticker_packs, on_delete: :cascade
    add_foreign_key :stickers, :active_storage_blobs, column: :blob_id, on_delete: :restrict
  end
end
