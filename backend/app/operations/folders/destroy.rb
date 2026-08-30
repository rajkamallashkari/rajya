module Folders
  class Destroy < ApplicationOperation
    def call(folder:, actor:)
      return failure(:forbidden) unless folder.account_id == actor.id

      folder.destroy!
      success(true)
    end
  end
end
