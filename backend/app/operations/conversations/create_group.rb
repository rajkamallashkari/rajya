module Conversations
  # Group/channel creation. ≥ min_members at creation (BR-54); size otherwise
  # uncapped unless max_members is set. Creator is owner; everyone else is
  # member — bots never receive admin/owner. Blank titles get a BR-55 fallback
  # so the groups_have_titles CHECK is always satisfied.
  class CreateGroup < ApplicationOperation
    def call(creator:, kind:, account_ids:, title:, description:)
      ids = normalize_ids(creator, account_ids)
      return failure(:validation_failed) unless enough_members?(ids)
      return failure(:validation_failed) if over_cap?(ids)
      return failure(:not_found) unless Account.where(id: ids).count == ids.size

      conversation = persist!(creator, kind, ids, title, description)
      success(View.for(conversation, creator, include_members: true))
    end

    private

    def normalize_ids(creator, account_ids)
      ids = Array(account_ids).map(&:to_i).reject(&:zero?).uniq
      ids.unshift(creator.id) unless ids.include?(creator.id)
      ids
    end

    def enough_members?(ids)
      ids.size >= Settings.fetch(:min_members)
    end

    def over_cap?(ids)
      max = Settings.fetch(:max_members)
      max.present? && ids.size > max
    end

    def persist!(creator, kind, ids, title, description)
      Conversation.transaction do
        conversation = Conversation.create!(
          kind: kind,
          title: title.presence || fallback_title,
          description: description,
          last_activity_at: Time.current
        )
        ids.each do |account_id|
          role = account_id == creator.id ? "owner" : "member"
          conversation.conversation_memberships.create!(
            account_id: account_id, role: role, joined_at: Time.current
          )
        end
        conversation
      end
    end

    def fallback_title
      # rubocop:disable Rajya/NoMagicNumbers -- BR-55 fallback uses a 3-byte hex token
      Catalog.t("conversations.fallback_title", token: SecureRandom.hex(3).upcase)
      # rubocop:enable Rajya/NoMagicNumbers
    end
  end
end
