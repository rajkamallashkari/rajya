module ExportJobs
  class IssueUrl < ApplicationOperation
    def call(job:)
      return failure(:not_found) unless job.ready? && job.blob.present?
      return failure(:not_found) if job.expired?

      ttl = Settings.fetch(:signed_url_ttl)
      success(UrlPayload.new(url: job.blob.url(expires_in: ttl), expires_at: ttl.seconds.from_now))
    end
  end
end
