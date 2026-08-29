module Conversations
  class Update < ApplicationOperation
    def call(account:, conversation:, title: nil, description: :unset)
      return failure(:forbidden) if conversation.direct?
      return failure(:validation_failed) if title_blank?(title)

      conversation.title = title unless title.nil?
      conversation.description = description unless description == :unset
      conversation.save!
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def title_blank?(title)
      title.is_a?(String) && title.strip.empty?
    end
  end
end
