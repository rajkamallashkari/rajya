module Bots
  class Generate < ApplicationOperation
    def call(conversation:, bot:, triggered_by:, regenerate_of_message_id: nil)
      @conversation = conversation
      @bot = bot
      @triggered_by = triggered_by
      @regenerate_of_message_id = regenerate_of_message_id
      return failure(:not_found) if @conversation.nil? || @bot.nil? || @triggered_by.nil?
      return success(existing) if existing

      run_generation
    end

    private

    def run_generation
      publish_started
      Ai::ConversationSummary.maybe_summarize!(@conversation, account: @bot.account)
      outcome = stream
      finish(outcome)
    end

    def stream
      result = Ai::Runner.stream_chat(
        messages: Ai::PromptAssembler.messages(
          conversation: @conversation, bot: @bot, triggered_by: @triggered_by
        ),
        capability: :bot_reply,
        account: @triggered_by.sender_account,
        conversation: @conversation,
        generation_id: generation_id
      ) do |delta|
        publish(:generation_chunk, "generation_id" => generation_id, "delta" => delta.to_s)
      end
      result
    end

    def finish(outcome)
      text = outcome.text.to_s
      if outcome.cancelled
        return persist_partial(text)
      end
      if outcome.status != "success" || text.blank?
        publish_cancelled(outcome.error_code)
        return failure(:upstream_failed)
      end

      PersistReply.call(
        conversation: @conversation, bot: @bot, body: text,
        triggered_by: @triggered_by, generation_id: generation_id, nonce: nonce
      )
    end

    def persist_partial(text)
      publish_cancelled
      return success(nil) if text.blank?

      PersistReply.call(
        conversation: @conversation, bot: @bot, body: text,
        triggered_by: @triggered_by, generation_id: generation_id, nonce: nonce
      )
    end

    def publish_started
      publish(
        :generation_started,
        "generation_id" => generation_id,
        "bot_account_id" => @bot.account_id,
        "triggered_by_message_id" => @triggered_by.id
      )
    end

    def publish_cancelled(error_code = nil)
      data = { "generation_id" => generation_id }
      data["error"] = error_code.to_s if error_code.present?
      publish(:generation_cancelled, data)
    end

    def publish(event, data)
      Realtime.publish(@conversation, event, data)
    end

    def existing
      Message.find_by(client_nonce: nonce)
    end

    def nonce
      Nonce.uuid(
        triggered_by_message_id: @triggered_by.id, bot_id: @bot.id,
        regenerate_of_message_id: @regenerate_of_message_id
      )
    end

    def generation_id
      Nonce.generation_id(
        conversation_id: @conversation.id, triggered_by_message_id: @triggered_by.id,
        bot_id: @bot.id, regenerate_of_message_id: @regenerate_of_message_id
      )
    end
  end
end
