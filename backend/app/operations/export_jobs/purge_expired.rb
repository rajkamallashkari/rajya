module ExportJobs
  class PurgeExpired < ApplicationOperation
    def call
      ExportJob.expired.find_each { |job| purge(job) }
      success(true)
    end

    private

    def purge(job)
      blob = job.blob
      job.update!(blob: nil, status: "failed", error_message: "expired")
      return if blob.nil?

      StorageQuotas::Release.call(account: job.account, blob: blob)
      blob.purge
    end
  end
end
