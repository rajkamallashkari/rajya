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
      max = Settings.fetch(:max_members)
      return false if max.blank?

      inactive = conversation.conversation_memberships.where(account_id: ids).where.not(status: "active").count
      new_rows = ids.size - inactive
      conversation.conversation_memberships.active.count + new_rows > max
    end

    def persist!(actor, conversation, ids)
      Conversation.transaction do
        ids.each { |account_id| upsert_member!(actor, conversation, account_id) }
      end
    end

    def upsert_member!(actor, conversation, account_id)
      row = conversation.conversation_memberships.find_or_initialize_by(account_id: account_id)
      rejoining = row.persisted?
      row.assign_attributes(
        role: "member", status: "active", invited_by_account: actor, joined_at: Time.current
      )
      row.save!
      Receipts::ReconcileUnreads.call(membership: row) if rejoining
      SystemEvents::Write.call(
        conversation: conversation, event: "member_added", actor: actor,
        payload: { name: row.account.display_name }
      )
    end
  end
end
