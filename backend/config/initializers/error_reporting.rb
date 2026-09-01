# frozen_string_literal: true

# Sentry is optional. Without SENTRY_DSN the reporter still logs; with a DSN
# it forwards unhandled errors (TARGET §1.1). Subscribe after autoload.
Rails.application.config.after_initialize do
  Rails.error.subscribe(Monitoring::ErrorSubscriber.new)

  next if ENV["SENTRY_DSN"].blank?

  require "sentry-ruby"
  Sentry.init do |config|
    config.dsn = ENV["SENTRY_DSN"]
    config.send_default_pii = false
    config.breadcrumbs_logger = [ :active_support_logger ]
  end
  Monitoring::Reporter.sink = lambda { |error, context|
    Sentry.capture_exception(error, extra: context)
  }
end
