# Storage health, AI usage aggregates, and Solid Queue counts for the admin
# dashboard (TARGET §7.4). Reads only.
module Admin
  class DashboardQuery < ApplicationQuery
    Report = Struct.new(:buckets, :quotas, :ai_usage, :jobs, keyword_init: true)

    def call
      Report.new(
        buckets: StorageBucket.order(:priority, :id).to_a,
        quotas: quota_rollups,
        ai_usage: usage_rollups,
        jobs: job_rollups
      )
    end

    private

    def quota_rollups
      used = StorageQuota.sum(:used_bytes)
      cap = StorageQuota.sum(:quota_bytes)
      {
        "accounts" => StorageQuota.count,
        "used_bytes" => used,
        "quota_bytes" => cap
      }
    end

    def usage_rollups
      AiUsageEvent.select(
        :capability, :status,
        # rubocop:disable Rajya/NoUserFacingStrings -- SQL aggregates, not UI copy
        "COUNT(*) AS event_count",
        "COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens_sum",
        "COALESCE(SUM(completion_tokens), 0) AS completion_tokens_sum"
        # rubocop:enable Rajya/NoUserFacingStrings
      ).group(:capability, :status).map do |row|
        {
          "capability" => row.capability,
          "status" => row.status,
          "count" => row.event_count,
          "prompt_tokens" => row.prompt_tokens_sum,
          "completion_tokens" => row.completion_tokens_sum
        }
      end
    end

    def job_rollups
      {
        "ready" => SolidQueue::ReadyExecution.count,
        "failed" => SolidQueue::FailedExecution.count,
        "processes" => SolidQueue::Process.count
      }
    end
  end
end
