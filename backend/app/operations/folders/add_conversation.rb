module Folders
  class AddConversation < ApplicationOperation
    def call(account:, folder:, conversation:)
      return failure(:forbidden) unless folder.account_id == account.id
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).show?

      entry = folder.conversation_folder_entries.find_or_initialize_by(conversation_id: conversation.id)
      if entry.new_record?
        entry.position = folder.conversation_folder_entries.count
        entry.save!
      end
      success(folder)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end
  end
end
