class AddGroupPermissionOverrides < ActiveRecord::Migration[8.0]
  def change
    add_column :conversations, :member_permissions, :jsonb, null: false, default: {}
    add_column :conversations, :slow_mode_seconds, :integer, null: false, default: 0
    add_column :conversations, :restrict_forwarding, :boolean, null: false, default: false
    add_check_constraint :conversations, "slow_mode_seconds >= 0", name: "ck_conversations_slow_mode_seconds"

    add_column :conversation_memberships, :last_message_at, :datetime
  end
end
