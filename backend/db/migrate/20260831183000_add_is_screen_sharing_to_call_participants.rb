# NR-47: 1:1 screen share is an extra WebRTC track; this flag drives remote UI.
class AddIsScreenSharingToCallParticipants < ActiveRecord::Migration[8.0]
  def change
    add_column :call_participants, :is_screen_sharing, :boolean, null: false, default: false
  end
end
