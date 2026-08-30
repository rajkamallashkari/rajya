module Conversations
  class Update < ApplicationOperation
    def call(account:, conversation:, title: nil, description: :unset)
      return failure(:forbidden) if conversation.direct?
      return failure(:validation_failed) if title_blank?(title)

      previous_title = conversation.title
      previous_description = conversation.description
      conversation.title = title unless title.nil?
      conversation.description = description unless description == :unset
      conversation.save!
      write_system_events!(account, conversation, previous_title, previous_description)
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def title_blank?(title)
      title.is_a?(String) && title.strip.empty?
    end

    def write_system_events!(account, conversation, previous_title, previous_description)
      if conversation.title_previously_changed? && conversation.title != previous_title
        SystemEvents::Write.call(
          conversation: conversation, event: "title_changed", actor: account,
          payload: { title: conversation.title, name: account.display_name }
        )
      end
      return unless conversation.description_previously_changed? && conversation.description != previous_description

      SystemEvents::Write.call(
        conversation: conversation, event: "description_changed", actor: account,
        payload: { name: account.display_name }
      )
    end
  end
end
