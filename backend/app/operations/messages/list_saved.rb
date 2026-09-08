module Messages
  class ListSaved < ApplicationOperation
    def call(saved_messages:)
      rows = saved_messages.includes(message: :sender_account).order(created_at: :desc)
      success(SavedList.new(saved_messages: rows.to_a))
    end
  end
end
