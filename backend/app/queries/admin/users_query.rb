# Admin user directory (TARGET §7.4). Search is optional; page size comes from
# the search setting so a dashboard change applies without a restart.
module Admin
  class UsersQuery < ApplicationQuery
    def initialize(query: nil)
      @query = query.to_s.strip
    end

    def call
      scope = User.joins(:account).includes(:account).order("accounts.display_name", "users.id")
      scope = apply_search(scope) if @query.present?
      scope.limit(::Settings.fetch(:search_page_size)).to_a
    end

    private

    def apply_search(scope)
      pattern = "%#{User.sanitize_sql_like(@query)}%"
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL predicate, not UI copy
      scope.where(
        "accounts.username ILIKE :q OR accounts.display_name ILIKE :q OR users.email ILIKE :q",
        q: pattern
      )
      # rubocop:enable Rajya/NoUserFacingStrings
    end
  end
end
