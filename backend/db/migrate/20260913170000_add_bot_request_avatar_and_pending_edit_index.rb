class AddBotRequestAvatarAndPendingEditIndex < ActiveRecord::Migration[8.0]
  def change
    add_column :bot_requests, :avatar_action, :string
    add_check_constraint :bot_requests, "avatar_action IN ('replace', 'remove')",
                         name: "ck_bot_requests_avatar_action"
    add_index :bot_requests, :target_bot_id, unique: true,
                                                 where: "kind = 'edit' AND status = 'pending'",
                                                 name: "idx_bot_requests_one_pending_edit"
  end
end
