module Conversations
  # Shared membership side effects for add/remove/leave/role changes (SCHEMA §3.2).
  module MembershipSupport
    module_function

    def view(account, conversation)
      Show.call(account: account, conversation: conversation).value
    end

    def write_role_changed(conversation, actor, membership, role)
      SystemEvents::Write.call(
        conversation: conversation, event: "role_changed", actor: actor,
        payload: { name: membership.account.display_name, role: Catalog.t("roles.#{role}") }
      )
    end

    def notify_departed(account, conversation)
      Realtime.publish(account, :sidebar_update, "conversation_id" => conversation.id)
    end

    def clear_personal_state(conversation, account)
      ConversationFolderEntry.joins(:folder).where(
        conversation_id: conversation.id, conversation_folders: { account_id: account.id }
      ).delete_all
      ScheduledMessage.where(conversation_id: conversation.id, sender_account_id: account.id).delete_all
    end

    def over_member_cap?(conversation, new_rows)
      max = Settings.fetch(:max_members)
      return false if max.blank?

      conversation.conversation_memberships.active.count + new_rows > max
    end

    # Rejoin flips the unique row back to active and keeps watermarks (BR-50).
    def activate!(conversation, account, invited_by:, event:, actor:)
      row = conversation.conversation_memberships.find_or_initialize_by(account_id: account.id)
      rejoining = row.persisted?
      row.assign_attributes(
        role: "member", status: "active", invited_by_account: invited_by, joined_at: Time.current
      )
      row.save!
      Receipts::ReconcileUnreads.call(membership: row) if rejoining
      SystemEvents::Write.call(
        conversation: conversation, event: event, actor: actor,
        payload: { name: account.display_name }
      )
      row
    end
  end
end
