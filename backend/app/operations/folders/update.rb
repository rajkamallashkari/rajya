module Folders
  class Update < ApplicationOperation
    def call(folder:, actor:, name: nil, position: nil)
      return failure(:forbidden) unless folder.account_id == actor.id

      folder.name = name.to_s.strip unless name.nil?
      folder.position = position.to_i unless position.nil?
      folder.save!
      success(folder)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end
  end
end
