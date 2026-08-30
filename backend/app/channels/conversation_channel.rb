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
  end
end
