module Attachments
  class Retry < ApplicationOperation
    def call(attachment:)
      return failure(:not_found) unless FeatureFlag.enabled?(:media_attachments)
      return failure(:validation_failed) unless attachment.processing_status == "failed"

      attachment.update!(processing_status: "pending", processing_error: nil)
      ProcessJob.perform_later(attachment.id)
      success(attachment)
    end
  end
end
