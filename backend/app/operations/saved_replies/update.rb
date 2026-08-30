module SavedReplies
  class Update < ApplicationOperation
    def call(saved_reply:, actor:, shortcut: nil, body: nil, position: nil)
      return failure(:forbidden) unless saved_reply.account_id == actor.id

      saved_reply.shortcut = shortcut.to_s.strip unless shortcut.nil?
      saved_reply.body = body.to_s.strip unless body.nil?
      saved_reply.position = position unless position.nil?
      saved_reply.save!
      success(saved_reply)
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      failure(:validation_failed)
    end
  end
end
