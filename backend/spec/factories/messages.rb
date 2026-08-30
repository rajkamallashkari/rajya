FactoryBot.define do
  factory :message do
    conversation
    sender_account { association :account }
    kind { "text" }
    body { "Hello!" }
    sequence(:position)
    sequence(:revision)

    after(:create) do |message|
      conversation = Conversation.find(message.conversation_id)
      updates = {}
      updates[:next_position] = message.position if conversation.next_position < message.position
      updates[:next_revision] = message.revision if conversation.next_revision < message.revision
      conversation.update_columns(updates) if updates.any?
    end
  end
end
