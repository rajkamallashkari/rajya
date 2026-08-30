module Attachments
  class TranscribeJob < ApplicationJob
    queue_as :low

    def self.retry_attempts
      Settings::Registry.entries.fetch(:transcribe_retry_attempts).fetch(:default)
    end

    retry_on StandardError, wait: :polynomially_longer, attempts: retry_attempts do |job, _error|
      attachment = Attachment.find_by(id: job.arguments.first)
      Transcribe.new.fail_record!(attachment) if attachment
    end

    def perform(attachment_id)
      Transcribe.call(attachment_id: attachment_id)
    end
  end
end
