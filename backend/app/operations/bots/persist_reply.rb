module Bots
  class PersistReply < ApplicationOperation
    def call(conversation:, bot:, body:, triggered_by:, generation_id:, nonce:)
      @conversation = conversation
      @bot = bot
      @body = body.to_s.strip
      @triggered_by = triggered_by
      @generation_id = generation_id
      @nonce = nonce
      return failure(:validation_failed) if @body.blank?

      existing = Message.find_by(client_nonce: @nonce)
      return success(existing) if existing

      persist_and_finish
    end

    private

    def persist_and_finish
      message = insert_row!
      Receipts::OnSend.call(conversation: @conversation, sender: @bot.account, position: message.position)
      consume_prompt!(message)
      touch_sidebar!(message)
      unarchive_on_activity!
      Realtime.publish(@conversation, :message_created, "message_id" => message.id)
      success(message)
    end

    def insert_row!
      Message.transaction do
        position, revision = Conversations::Sequencer.next_send!(@conversation.id)
        Message.create!(
          conversation: @conversation,
          sender_account: @bot.account,
          body: @body,
          kind: "text",
          client_nonce: @nonce,
          position: position,
          revision: revision,
          sender_snapshot: Messages::Snapshot.for(@bot.account),
          metadata: {
            "triggered_by_message_id" => @triggered_by.id,
            "prompted_by_account_id" => @triggered_by.sender_account_id,
            "generation_id" => @generation_id
          }
        )
      end
    end

    def consume_prompt!(message)
      Receipts::Advance.call(
        account: @bot.account, conversation: @conversation,
        position: [ @triggered_by.position, message.position ].max, kind: "bot_consume"
      )
    end

    def touch_sidebar!(message)
      @conversation.update_columns(last_message_id: message.id, last_activity_at: message.created_at)
    end

    def unarchive_on_activity!
      ConversationMembership.active.where(conversation_id: @conversation.id)
                            .where.not(archived_at: nil)
                            .update_all(archived_at: nil, updated_at: Time.current)
    end
  end
end
