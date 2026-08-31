# BR-63 persists busy as a non-live participant status so a second incoming
# call does not hit one_live_call_per_account. SCHEMA §3 omitted `busy` from
# the CHECK; this restores the audited status. BR-67 looks up the single
# call-history bubble via metadata->>'call_id'.
class AddCallBusyStatusAndHistoryIndex < ActiveRecord::Migration[8.0]
  def up
    remove_check_constraint :call_participants, name: "ck_call_participants_status"
    add_check_constraint :call_participants,
                         "status IN ('invited', 'ringing', 'joined', 'left', 'declined', 'missed', 'busy')",
                         name: "ck_call_participants_status"

    add_index :messages, "(metadata->>'call_id')",
              unique: true,
              where: "kind = 'system' AND metadata->>'call_id' IS NOT NULL",
              name: "idx_messages_one_system_per_call"
  end

  def down
    remove_index :messages, name: "idx_messages_one_system_per_call"
    remove_check_constraint :call_participants, name: "ck_call_participants_status"
    add_check_constraint :call_participants,
                         "status IN ('invited', 'ringing', 'joined', 'left', 'declined', 'missed')",
                         name: "ck_call_participants_status"
  end
end
