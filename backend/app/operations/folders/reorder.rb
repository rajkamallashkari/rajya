module Folders
  class Reorder < ApplicationOperation
    def call(account:, ids:, folders:)
      wanted = Array(ids).map(&:to_i)
      owned = folders.where(account: account)
      return failure(:validation_failed) unless wanted.sort == owned.ids.sort

      ConversationFolder.transaction do
        wanted.each_with_index do |id, pos|
          owned.where(id: id).update_all(position: pos)
        end
      end
      success(Index.call(account: account, folders: folders).value)
    end
  end
end
