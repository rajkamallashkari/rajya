module Ai
  class Runner
    Result = Struct.new(:transcript, :status, :error_code, :provider, :model, keyword_init: true)

    def self.transcribe(io:, filename:, content_type:, account:, conversation:)
      new.transcribe(
        io: io, filename: filename, content_type: content_type,
        account: account, conversation: conversation
      )
    end

    def transcribe(io:, filename:, content_type:, account:, conversation:)
      chain = ModelRegistry.chain_for(:transcribe)
      last = Result.new(status: "failed", error_code: "upstream_failed", provider: "none", model: "none")
      chain.each do |entry|
        last = attempt(entry, io: io, filename: filename, content_type: content_type,
                        account: account, conversation: conversation)
        return last if last.status == "success"
        io.rewind if io.respond_to?(:rewind)
      end
      last
    end

    private

    def attempt(entry, io:, filename:, content_type:, account:, conversation:)
      provider = ModelRegistry.provider_for(entry.provider)
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      outcome = provider&.transcribe(io: io, filename: filename, content_type: content_type, model: entry.model)
      latency = milliseconds(started)
      record_usage(account, conversation, entry, outcome, latency)
      result_for(entry, outcome)
    end

    def result_for(entry, outcome)
      if outcome.is_a?(Ai::Providers::Groq::Transcript)
        Result.new(transcript: outcome, status: "success", provider: entry.provider, model: entry.model)
      else
        Result.new(
          status: "failed", error_code: (outcome || :upstream_failed).to_s,
          provider: entry.provider, model: entry.model
        )
      end
    end

    def record_usage(account, conversation, entry, outcome, latency)
      success = outcome.is_a?(Ai::Providers::Groq::Transcript)
      AiUsageEvent.create!(
        account: account,
        conversation: conversation,
        capability: "transcribe",
        provider: entry.provider,
        model: entry.model,
        latency_ms: latency,
        status: success ? "success" : "failed",
        error_code: success ? nil : (outcome || :upstream_failed).to_s
      )
    end

    def milliseconds(started)
      elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
      (elapsed * 1.second.in_milliseconds).round
    end
  end
end
