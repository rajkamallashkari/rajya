# Rolling context compression (BR-75). Everything before the live window is
# folded into conversations.context_summary and watermarked by
# summarized_through_message_id. Failures skip rather than block the reply.
module Ai
  class ConversationSummary
    def self.maybe_summarize!(conversation, account:)
      new(conversation, account).call
    end

    def initialize(conversation, account)
      @conversation = conversation
      @account = account
    end

    def call
      oldest = oldest_window_message
      return unless oldest && unsummarized_before(oldest).exists?

      excerpt = visible.order(:position).where(messages[:position].lt(oldest.position)).to_a
      summary = request_summary(excerpt)
      return if summary.blank?

      @conversation.update!(context_summary: summary, summarized_through_message: excerpt.last)
    end

    private

    def oldest_window_message
      total = visible.count
      window = Limits.context_window
      return if total <= Limits.summarization_threshold
      return if total <= window

      visible.order(:position).offset(total - window).first
    end

    def unsummarized_before(oldest)
      scope = visible.where(messages[:position].lt(oldest.position))
      last = @conversation.summarized_through_message
      last ? scope.where(messages[:position].gt(last.position)) : scope
    end

    def request_summary(excerpt)
      convo = excerpt.map { |message| "#{label_for(message)}: #{message.body}" }.join("\n")
      result = Runner.chat(
        messages: [
          { role: "system", content: PromptTemplate.fetch(:conversation_summary) },
          { role: "user", content: convo }
        ],
        capability: :summarize,
        account: @account,
        conversation: @conversation
      )
      result.status == "success" ? result.text.to_s.strip.presence : nil
    end

    def label_for(message)
      message.sender_account&.bot? ? "Bot" : "User"
    end

    def visible
      @conversation.messages.visible.where.not(kind: "system").where.not(body: nil)
    end

    def messages
      Message.arel_table
    end
  end
end
