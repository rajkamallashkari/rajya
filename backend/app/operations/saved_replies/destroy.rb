module SavedReplies
  class Destroy < ApplicationOperation
    def call(saved_reply:, actor:)
      return failure(:forbidden) unless saved_reply.account_id == actor.id

      saved_reply.destroy!
      success(true)
    end
  end
end
