module Push
  class FanoutJob < ApplicationJob
    queue_as :default

    def self.retry_attempts
      Settings::Registry.entries.fetch(:notification_retry_policy).fetch(:default).fetch("max_attempts")
    end

    retry_on StandardError, wait: :polynomially_longer, attempts: retry_attempts

    def perform(event, payload, recipient_account_ids)
      Fanout.call(event: event, payload: payload, recipient_account_ids: recipient_account_ids)
    end
  end
end
