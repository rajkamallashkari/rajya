module Conversations
  # Admin/owner add. Rejoin flips the unique row back to active and keeps
  # watermarks (SCHEMA §3.2 / BR-50). Role always lands as member so a former
  # admin does not return with privileges.
  class AddMembers < ApplicationOperation
    def call(actor:, conversation:, account_ids:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).add_members?
      return failure(:forbidden) if conversation.direct?

      ids = normalize_ids(actor, account_ids)
      return failure(:validation_failed) if ids.empty?
      return failure(:not_found) unless Account.where(id: ids).count == ids.size
      return failure(:conflict) if already_active?(conversation, ids)
      return failure(:validation_failed) if over_cap?(conversation, ids)

      persist!(actor, conversation, ids)
      success(MembershipSupport.view(actor, conversation))
    end

    private

    def normalize_ids(actor, account_ids)
      Array(account_ids).map(&:to_i).uniq.reject(&:zero?) - [ actor.id ]
    end

    def already_active?(conversation, ids)
      conversation.conversation_memberships.active.where(account_id: ids).exists?
    end

    def over_cap?(conversation, ids)
      inactive = conversation.conversation_memberships.where(account_id: ids).where.not(status: "active").count
      MembershipSupport.over_member_cap?(conversation, ids.size - inactive)
    end

    def persist!(actor, conversation, ids)
      Conversation.transaction do
        ids.each do |account_id|
          MembershipSupport.activate!(
            conversation, Account.find(account_id), invited_by: actor, event: "member_added", actor: actor
          )
        end
      end
    end
  end
end
