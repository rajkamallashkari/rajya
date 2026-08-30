module Conversations
  class Unmute < ApplicationOperation
    def call(account:, conversation:)
      Conversations::Mute.call(account: account, conversation: conversation, duration: 0)
    end
  end
end
