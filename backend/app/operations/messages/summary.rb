module Messages
  module Summary
    module_function

    def refresh!(message)
      Message.transaction do
        message.update!(
          reaction_summary: message.reactions.group(:emoji).count,
          revision: Conversations::Sequencer.next_revision!(message.conversation_id)
        )
      end
    end
  end
end
