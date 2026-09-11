module ScheduledMessages
  class Index < ApplicationOperation
    def call(account:, scheduled_messages:)
      rows = scheduled_messages.where(sender_account: account).order(:scheduled_at).to_a
      success(List.new(scheduled_messages: rows))
    end
  end
end
