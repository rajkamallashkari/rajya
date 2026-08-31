module Search
  # SQL predicates — not user-facing copy.
  # rubocop:disable Rajya/NoUserFacingStrings
  class AccountHits < ApplicationQuery
    def initialize(account:, query:)
      @account = account
      @raw = query.to_s.strip
    end

    def call
      return [] if @raw.length < Settings.fetch(:search_min_query_length)

      rows = if email_query?
        email_hits
      elsif phone_query?
        phone_hits
      else
        username_or_name
      end
      rows.reject { |row| blocked?(row.id) }
    end

    private

    def email_query?
      @raw.include?("@") && !@raw.start_with?("@")
    end

    def phone_query?
      @raw.match?(/\A\+\d/)
    end

    def email_hits
      gated_humans.where("LOWER(users.email) = LOWER(?)", @raw)
                  .where(discoverable_sql("discoverable_by_email"), Preference.privacy_default("discoverable_by_email"))
                  .includes(:user)
                  .order(:display_name)
                  .limit(Settings.fetch(:search_page_size))
                  .to_a
    end

    def phone_hits
      gated_humans.where("users.phone = ?", @raw)
                  .where(discoverable_sql("discoverable_by_phone"), Preference.privacy_default("discoverable_by_phone"))
                  .includes(:user)
                  .order(:display_name)
                  .limit(Settings.fetch(:search_page_size))
                  .to_a
    end

    def gated_humans
      Account.joins(:user)
             .joins(preference_join)
             .where(kind: "human", deactivated_at: nil)
             .where.not(id: @account.id)
    end

    def username_or_name
      token = @raw.delete_prefix("@")
      return [] if token.length < Settings.fetch(:search_min_query_length)

      pattern = @raw.start_with?("@") ? "#{sanitize(token)}%" : "%#{sanitize(token)}%"
      condition = if @raw.start_with?("@")
        "LOWER(accounts.username) LIKE LOWER(?)"
      else
        "LOWER(accounts.username) LIKE LOWER(?) OR LOWER(accounts.display_name) LIKE LOWER(?)"
      end
      binds = @raw.start_with?("@") ? [ pattern ] : [ pattern, pattern ]
      Account.joins(preference_join)
             .where(kind: "human", deactivated_at: nil)
             .where.not(id: @account.id)
             .where(condition, *binds)
             .where(discoverable_sql("discoverable_by_username"), Preference.privacy_default("discoverable_by_username"))
             .order(:display_name)
             .limit(Settings.fetch(:search_page_size))
             .to_a
    end

    def preference_join
      "LEFT JOIN preferences ON preferences.account_id = accounts.id"
    end

    def discoverable_sql(flag)
      "COALESCE((preferences.data #>> '{privacy,#{flag}}')::boolean, ?) = TRUE"
    end

    def sanitize(value)
      Account.sanitize_sql_like(value)
    end

    def blocked?(other_id)
      blocked_ids.include?(other_id)
    end

    def blocked_ids
      @blocked_ids ||= Block.where("blocker_account_id = :id OR blocked_account_id = :id", id: @account.id)
                            .pluck(:blocker_account_id, :blocked_account_id)
                            .flatten
                            .uniq
                            .to_set
    end
  end
  # rubocop:enable Rajya/NoUserFacingStrings
end
