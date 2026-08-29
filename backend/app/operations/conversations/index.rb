module Conversations
  class Index < ApplicationOperation
    def call(account:, conversations:)
      rows = Conversations::Sidebar.call(scope: conversations)
      success(List.new(conversations: rows, viewer: account))
    end
  end
end
