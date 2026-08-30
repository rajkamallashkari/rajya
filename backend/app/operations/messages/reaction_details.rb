module Messages
  class ReactionDetails < ApplicationOperation
    def call(message:)
      rows = message.reactions.includes(:account).order(:created_at, :id).to_a
      success(ReactionList.new(reactions: rows))
    end
  end
end
