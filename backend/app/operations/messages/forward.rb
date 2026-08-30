module Messages
  class Forward < ApplicationOperation
    def call(message:, actor:, target:)
      return failure(:forbidden) unless MessagePolicy.new(actor, message).forward?
      return failure(:forbidden) unless ConversationPolicy.new(actor, target).send?
      return failure(:forbidden) unless target_content_allowed?(actor, target, message)
      return failure(:not_found) if message.deleted?

      wait = SlowMode.retry_after(conversation: target, sender: actor)
      return failure(:rate_limited, details: { retry_after: wait }) if wait

      copy = persist!(message, actor, target)
      Receipts::OnSend.call(conversation: target, sender: actor, position: copy.position)
      SlowMode.touch!(conversation: target, sender: actor)
      Realtime.publish("conversation:#{target.id}", :message_created, "message_id" => copy.id)
      success(copy)
    end

    private

    def target_content_allowed?(actor, target, message)
      policy = ConversationPolicy.new(actor, target)
      return false if message.poll.present? && !policy.create_polls?
      return false if (message.attachment_count.positive? || message.kind == "voice") && !policy.send_media?
      return false if message.body.present? && !policy.send_messages?

      true
    end

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
