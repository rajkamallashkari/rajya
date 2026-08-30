module ExportJobs
  class Generate < ApplicationOperation
    def call(export_job_id: nil, job: nil)
      record = job || ExportJob.find_by(id: export_job_id)
      return success(record) if record.nil? || record.ready?

      record.update!(status: "processing", error_message: nil)
      body, filename, content_type = Writer.call(job: record)
      attach!(record, body, filename, content_type)
      success(record.reload)
    rescue StandardError
      fail_record!(record, "unreadable")
      success(record)
    end

    def fail_record!(record, code)
      return if record.nil?

      record.update!(status: "failed", error_message: code)
    end

    private

    def attach!(record, body, filename, content_type)
      bytes = body.bytesize
      quota = StorageQuota.ensure_for!(record.account)
      unless quota.can_upload?(bytes)
        fail_record!(record, "quota_exceeded")
        return
      end

      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(body),
        filename: filename,
        content_type: content_type
      )
      record.update!(blob: blob, status: "ready")
      StorageQuotas::Charge.call(account: record.account, blob: blob)
    end
  end
end
