# Messages, edits, deletions, reactions, pins, system events (TARGET §3).
# Subscribe/authorize/relay only — no business writes (CONVENTIONS.md §2.1).
class ConversationChannel < ApplicationCable::Channel
  def subscribed
    conversation = Conversation.find_by(id: params[:conversation_id])
    unless conversation && ConversationPolicy.new(current_account, conversation).show?
      reject
      return
    end

    stream_from Realtime.conversation_stream(conversation.id)
    Receipts::Subscribers.add(conversation.id, current_account.id)
    @tracking_conversation_id = conversation.id
  end

  def unsubscribed
    return if @tracking_conversation_id.blank?

    Receipts::Subscribers.remove(@tracking_conversation_id, current_account.id)
  end
end
