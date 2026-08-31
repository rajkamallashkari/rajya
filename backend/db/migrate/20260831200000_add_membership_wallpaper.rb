class AddMembershipWallpaper < ActiveRecord::Migration[8.0]
  def change
    add_column :conversation_memberships, :wallpaper, :jsonb
  end
end
