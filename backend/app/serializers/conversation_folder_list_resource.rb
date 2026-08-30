class ConversationFolderListResource < ApplicationResource
  attribute :folders do
    object.folders.map { |folder| ConversationFolderResource.new(folder).to_h }
  end
end
