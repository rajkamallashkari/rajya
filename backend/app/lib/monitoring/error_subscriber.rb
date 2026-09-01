module Monitoring
  class ErrorSubscriber
    def report(error, handled:, severity:, context:, source: nil)
      return if handled
      return if error.is_a?(SystemStackError)

      Reporter.capture(
        error,
        context: { "severity" => severity.to_s, "source" => source.to_s }
      )
    end
  end
end
