module Messages
  class Forward < ApplicationOperation
    def call(message:, actor:, target:)
      return failure(:forbidden) unless MessagePolicy.new(actor, message).forward?
      return failure(:forbidden) unless ConversationPolicy.new(actor, target).send?
      return failure(:not_found) if message.deleted?

      copy = persist!(message, actor, target)
      Receipts::OnSend.call(conversation: target, sender: actor, position: copy.position)
      Realtime.publish("conversation:#{target.id}", :message_created, "message_id" => copy.id)
      success(copy)
    end

    private

    def persist!(message, actor, target)
      Message.transaction do
        message.increment!(:forward_count)
        copy = insert_copy!(message, actor, target)
        Blobs.copy!(message, copy)
        Children.copy!(message, copy)
        target.update_columns(last_message_id: copy.id, last_activity_at: copy.created_at)
        copy
      end
    end

    def insert_copy!(message, actor, target)
      position, revision = Conversations::Sequencer.next_send!(target.id)
      Message.create!(
        conversation: target,
        sender_account: actor,
        body: message.body,
        kind: message.kind,
        forwarded_from_account: message.sender_account,
        position: position,
        revision: revision,
        sender_snapshot: Snapshot.for(actor),
        attachment_count: 0
      )
    end
  end
end
