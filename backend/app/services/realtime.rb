# Single broadcast entry point (CONVENTIONS.md §2.6, TARGET_ARCHITECTURE.md §3).
# Buffers until the open joinable transaction commits so a rollback never
# reaches a client. Conversation events fan out in one recipient query and one
# broadcast per stream (F-19) — never a query or push job per participant.
module Realtime
  CONVERSATION_STREAM = /\Aconversation:(\d+)\z/
  BUFFER_KEY = :rajya_realtime_buffer

  Item = Data.define(:stream, :event, :data, :conversation_id) do
    def conversation_fanout?
      !conversation_id.nil?
    end
  end

  class << self
    def conversation_stream(id) = "conversation:#{id}"
    def account_stream(id) = "account:#{id}"
    def presence_stream(id) = "presence:#{id}"
    def signaling_stream(id) = "signaling:account:#{id}"

    def publish(target, event, payload = {})
      buffer << item_for(target, event, payload)
      schedule_flush
      nil
    end

    def reset!
      Thread.current[BUFFER_KEY] = []
    end

    def flush!
      items = take_buffer
      return if items.empty?

      recipient_ids = recipient_map(items)
      items.each { |item| broadcast(item) }
      fanout(items, recipient_ids)
    end

    def discard!
      reset!
    end

    private

    def buffer
      Thread.current[BUFFER_KEY] ||= []
    end

    def take_buffer
      items = buffer.dup
      reset!
      items
    end

    def item_for(target, event, payload)
      data = normalize_payload(payload)
      case target
      when Conversation
        conversation_item(target.id, event, data)
      when Account
        Item.new(account_stream(target.id), event, data.merge("account_id" => target.id), nil)
      when String
        from_stream(target, event, data)
      else
        raise ArgumentError, "Realtime.publish target is a Conversation, Account, or stream name"
      end
    end

    def from_stream(stream, event, data)
      if (match = CONVERSATION_STREAM.match(stream))
        conversation_item(Integer(match[1], 10), event, data)
      else
        Item.new(stream, event, data, nil)
      end
    end

    def conversation_item(conversation_id, event, data)
      Item.new(
        conversation_stream(conversation_id),
        event,
        data.merge("conversation_id" => conversation_id),
        conversation_id
      )
    end

    def normalize_payload(payload)
      case payload
      when Hash then payload.to_h.stringify_keys
      when Message then { "message_id" => payload.id }
      else {}
      end
    end

    def schedule_flush
      transaction = current_joinable_transaction
      return flush! if transaction.nil?

      return if transaction.instance_variable_get(:@rajya_realtime_hooked)

      transaction.instance_variable_set(:@rajya_realtime_hooked, true)
      transaction.after_commit { flush! }
      transaction.after_rollback { discard! }
    end

    def current_joinable_transaction
      connection = ActiveRecord::Base.connection
      return unless connection.transaction_open?

      transaction = connection.current_transaction
      transaction if transaction.joinable?
    end

    def recipient_map(items)
      items.select(&:conversation_fanout?).map(&:conversation_id).uniq.each_with_object({}) do |id, map|
        map[id] = Conversations::HumanMembers.call(conversation_id: id)
      end
    end

    def fanout(items, recipient_ids)
      items.select(&:conversation_fanout?).group_by(&:conversation_id).each do |conversation_id, grouped|
        ids = recipient_ids.fetch(conversation_id)
        ids.each { |account_id| broadcast_sidebar(account_id, conversation_id) }
        grouped.each { |item| enqueue_push(item, ids) }
      end
    end

    def broadcast(item)
      ActionCable.server.broadcast(item.stream, event_hash(item.event, item.data))
    end

    def broadcast_sidebar(account_id, conversation_id)
      ActionCable.server.broadcast(
        account_stream(account_id),
        event_hash(:sidebar_update, "conversation_id" => conversation_id)
      )
    end

    def enqueue_push(item, recipient_account_ids)
      Push::FanoutJob.perform_later(item.event.to_s, item.data, recipient_account_ids)
    end

    def event_hash(event, data)
      RealtimeEventResource.new({ type: event, data: data }).to_h
    end
  end
end
