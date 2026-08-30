module Attachments
  class ProcessJob < ApplicationJob
    queue_as :default

    def self.retry_attempts
      Settings::Registry.entries.fetch(:media_process_retry_attempts).fetch(:default)
    end

    retry_on StandardError, wait: :polynomially_longer, attempts: retry_attempts do |job, _error|
      attachment = Attachment.find_by(id: job.arguments.first)
      Process.new.fail_record!(attachment, "unreadable") if attachment
    end

    def perform(attachment_id)
      Process.call(attachment_id: attachment_id)
    end
  end
end
