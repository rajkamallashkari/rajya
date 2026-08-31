module Ai
  SuggestResult = Struct.new(:suggestions, keyword_init: true)

  class SuggestReplies < ApplicationOperation
    def call(account:, conversation:, message_id:)
      message = conversation&.messages&.find_by(id: message_id)
      return failure(:not_found) if message.nil? || message.deleted? || message.body.blank?

      outcome = Complete.call(
        account: account, capability: :suggest_replies, conversation: conversation,
        messages: [
          { role: "system", content: system_prompt(account) },
          { role: "user", content: message.body.to_s }
        ]
      )
      return outcome unless outcome.success?

      suggestions = outcome.value.text.to_s.lines.map { |line| line.strip.sub(/\A[-*\d.]+\s*/, "") }
                            .compact_blank.first(Ai::Limits.suggest_replies_count)
      success(SuggestResult.new(suggestions: suggestions))
    end

    private

    def system_prompt(account)
      [ PromptTemplate.fetch(:suggest_replies), StyleContext.prompt_for(account) ].compact.join("\n\n")
    end
  end
end
