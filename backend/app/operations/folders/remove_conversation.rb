module Folders
  class RemoveConversation < ApplicationOperation
    def call(account:, folder:, conversation:)
      return failure(:forbidden) unless folder.account_id == account.id
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).show?

      folder.conversation_folder_entries.where(conversation_id: conversation.id).delete_all
      folder.conversation_folder_entries.reset
      success(folder)
    end
  end
end
