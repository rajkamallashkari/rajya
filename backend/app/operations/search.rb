module Search
  MessageHit = Struct.new(:message, :snippet, :can_forward, keyword_init: true)
  ConversationHit = Struct.new(:id, :title, :kind, keyword_init: true)
  GlobalPayload = Struct.new(:query, :messages, :accounts, :conversations, keyword_init: true)
  ConversationPayload = Struct.new(:query, :messages, keyword_init: true)
  AccountPayload = Struct.new(:accounts, keyword_init: true)
end
