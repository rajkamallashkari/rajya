module Folders
  class Create < ApplicationOperation
    def call(account:, name:, position: nil)
      return failure(:forbidden) if account.blank?

      folder = account.conversation_folders.new(name: name.to_s.strip, position: next_position(account, position))
      folder.save!
      success(folder)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    private

    def next_position(account, position)
      return position.to_i unless position.nil?

      account.conversation_folders.count
    end
  end
end
