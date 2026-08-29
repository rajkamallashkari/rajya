module ConversationHelpers
  def create_direct_between(left, right = left)
    conversation = create(:conversation, :direct, direct_key: Conversation.direct_key_for(left.id, right.id))
    create(:conversation_membership, conversation: conversation, account: left)
    create(:conversation_membership, conversation: conversation, account: right) unless left.id == right.id
    conversation
  end

  def create_talk(kind:, owner:, members: [], admins: [])
    conversation = kind == "channel" ? create(:conversation, :channel) : create(:conversation)
    create(:conversation_membership, :owner, conversation: conversation, account: owner)
    admins.each { |account| create(:conversation_membership, :admin, conversation: conversation, account: account) }
    members.each { |account| create(:conversation_membership, conversation: conversation, account: account) }
    conversation
  end
end
