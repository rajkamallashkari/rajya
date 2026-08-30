module ExportJobs
  class Payload < ApplicationQuery
    Row = Struct.new(:conversation, :messages, keyword_init: true)

    def initialize(account:, conversation: nil)
      @account = account
      @conversation = conversation
    end

    def call
      conversations.map { |conversation| Row.new(conversation: conversation, messages: messages_for(conversation)) }
    end

    private

    def conversations
      scope = Conversation.joins(:conversation_memberships).merge(ConversationMembership.active)
                          .where(conversation_memberships: { account_id: @account.id })
                          .where(restrict_forwarding: false)
      scope = scope.where(id: @conversation.id) if @conversation
      scope.distinct.order(:id).to_a
    end

    def messages_for(conversation)
      Messages::Preloader.apply(conversation.messages.order(:position))
                         .includes(attachments: { file_attachment: :blob })
                         .to_a
    end
  end
end
