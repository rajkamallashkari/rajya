# Accounts allowed to see +account+'s online status: humans, last_active on for
# both sides (BR-42), and never a blocked counterpart (TARGET §3 / NR-1).
module Presence
  class Viewers < ApplicationQuery
    # JSONB privacy predicate — not user-facing copy.
    # rubocop:disable Rajya/NoUserFacingStrings
    LAST_ACTIVE_SQL = <<~SQL.squish
      preferences.account_id IS NULL
      OR COALESCE((preferences.data #>> '{privacy,last_active}')::boolean, TRUE) = TRUE
    SQL
    # rubocop:enable Rajya/NoUserFacingStrings

    def initialize(account:)
      @account = account
    end

    def call
      return [] unless @account.human? && @account.last_active_enabled?

      Account.where(kind: "human")
             .where.not(id: @account.id)
             .where.not(id: blocked_account_ids)
             .left_joins(:preference)
             .where(LAST_ACTIVE_SQL)
             .pluck(:id)
    end

    private

    def blocked_account_ids
      blocked = Block.arel_table
      Block.where(blocked[:blocker_account_id].eq(@account.id)
                  .or(blocked[:blocked_account_id].eq(@account.id)))
           .pluck(:blocker_account_id, :blocked_account_id)
           .flatten
           .uniq
           .excluding(@account.id)
    end
  end
end
