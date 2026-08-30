module Folders
  class Index < ApplicationOperation
    def call(account:, folders:)
      rows = folders.where(account: account).includes(:conversation_folder_entries).order(:position, :id).to_a
      success(List.new(folders: rows))
    end
  end
end
