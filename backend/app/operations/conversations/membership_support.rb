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
  end
end
