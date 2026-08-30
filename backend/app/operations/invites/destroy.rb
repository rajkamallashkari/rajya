module Invites
  class Destroy < ApplicationOperation
    def call(actor:, invite:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, invite.conversation).create_invite?

      invite.destroy!
      success(true)
    end
  end
end
