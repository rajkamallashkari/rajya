module Conversations
  View = Struct.new(:conversation, :viewer, :membership, :include_members, keyword_init: true) do
    def self.for(conversation, viewer, include_members: false)
      new(
        conversation: conversation,
        viewer: viewer,
        membership: membership_for(conversation, viewer),
        include_members: include_members
      )
    end

    def self.membership_for(conversation, viewer)
      if conversation.association(:conversation_memberships).loaded?
        conversation.conversation_memberships.find { |row| row.account_id == viewer.id }
      else
        conversation.conversation_memberships.find_by(account_id: viewer.id)
      end
    end
  end
end
