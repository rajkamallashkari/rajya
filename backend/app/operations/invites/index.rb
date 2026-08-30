module Invites
  class Index < ApplicationOperation
    def call(conversation:)
      success(List.new(invites: conversation.group_invites.order(created_at: :desc).to_a))
    end
  end
end
