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

  def typing(data)
    return if @tracking_conversation_id.blank?

    Typing::Announce.call(
      account: current_account,
      conversation_id: @tracking_conversation_id,
      activity: data["activity"]
    )
  end

  def cancel(data)
    return if @tracking_conversation_id.blank?

    conversation = Conversation.find_by(id: @tracking_conversation_id)
    return if conversation.nil?

    Bots::Cancel.call(
      account: current_account, conversation: conversation, generation_id: data["generation_id"]
    )
  end
end
