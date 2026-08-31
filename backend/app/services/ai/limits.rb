# Settings-backed AI windows and thresholds (SCHEMA §8). Callers read these
# rather than Settings.fetch so a DB override is the only knob 9.2+ needs.
module Ai
  class Limits
    class << self
      def context_window
        Settings.fetch(:ai_context_window)
      end

      def summarization_threshold
        Settings.fetch(:ai_summarization_threshold)
      end

      def prompt_minimum_length
        Settings.fetch(:ai_prompt_minimum_length)
      end

      def stream_timeout
        Settings.fetch(:ai_stream_timeout)
      end

      def fallback_attempt_cap
        Settings.fetch(:ai_fallback_attempt_cap)
      end

      def max_tokens
        Settings.fetch(:ai_max_tokens)
      end

      def temperature
        Settings.fetch(:ai_temperature)
      end

      def cancel_ttl
        Settings.fetch(:ai_cancel_ttl)
      end
    end
  end
end
