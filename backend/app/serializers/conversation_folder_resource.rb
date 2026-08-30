class ConversationFolderResource < ApplicationResource
  attributes :id, :name, :position, :created_at, :updated_at

  attribute :conversation_ids do
    if object.association(:conversation_folder_entries).loaded?
      object.conversation_folder_entries.sort_by(&:position).map(&:conversation_id)
    else
      object.conversation_folder_entries.order(:position).pluck(:conversation_id)
    end
  end
end
