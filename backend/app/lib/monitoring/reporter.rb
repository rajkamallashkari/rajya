module Monitoring
  class Reporter
    class << self
      attr_accessor :sink

      def capture(error, context: {})
        Rails.logger.error(
          {
            event: "monitoring.error",
            class: error.class.name,
            message: error.message,
            context: context
          }.to_json
        )
        sink&.call(error, context)
      end
    end
  end
end
