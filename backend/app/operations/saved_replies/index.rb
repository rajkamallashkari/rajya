module SavedReplies
  class Index < ApplicationOperation
    def call(account:, saved_replies:)
      rows = saved_replies.where(account: account).order(:position, :id).to_a
      success(List.new(saved_replies: rows))
    end
  end
end
