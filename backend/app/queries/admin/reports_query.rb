# Filtered moderation inbox. Age is a rolling window from `app_settings` page size.
module Admin
  class ReportsQuery < ApplicationQuery
    def initialize(status: nil, subject_type: nil, max_age_hours: nil)
      @status = status.to_s.strip.presence
      @subject_type = subject_type.to_s.strip.presence
      @max_age_hours = max_age_hours
    end

    def call
      scope = Report.includes(:reporter_account).order(created_at: :desc, id: :desc)
      scope = scope.where(status: @status) if @status
      scope = scope.where(subject_type: @subject_type) if @subject_type
      hours = Integer(@max_age_hours, exception: false)
      scope = scope.where(created_at: hours.hours.ago..) if hours&.positive?
      scope.limit(::Settings.fetch(:search_page_size)).to_a
    end
  end
end
