module Ai
  class Runner
    Result = Struct.new(
      :text, :transcript, :vectors, :image, :status, :error_code, :provider, :model,
      :cancelled, :prompt_tokens, :completion_tokens, keyword_init: true
    )
    SKIPPABLE = %w[payment_required quota_exhausted model_unavailable timeout missing_key unsupported].freeze

    def self.transcribe(...)
      new.transcribe(...)
    end

    def self.chat(...)
      new.chat(...)
    end

    def self.stream_chat(...)
      new.stream_chat(...)
    end

    def self.embed(...)
      new.embed(...)
    end

    def self.generate_image(...)
      new.generate_image(...)
    end

    def transcribe(io:, filename:, content_type:, account:, conversation:)
      run(:transcribe, account: account, conversation: conversation, stream: false,
          io: io, filename: filename, content_type: content_type)
    end

    def chat(messages:, capability:, account:, conversation: nil, tools: nil, images: nil)
      run(capability, account: account, conversation: conversation, stream: false,
          messages: messages, tools: tools, images: images)
    end

    def stream_chat(messages:, capability:, account:, conversation: nil, generation_id: nil,
                    tools: nil, images: nil, &on_delta)
      run(capability, account: account, conversation: conversation, generation_id: generation_id, stream: true,
          messages: messages, tools: tools, images: images, &on_delta)
    end

    def embed(texts:, account:, conversation: nil)
      run(:embedding, account: account, conversation: conversation, stream: false, texts: texts)
    end

    def generate_image(prompt:, account:, conversation: nil)
      run(:image_gen, account: account, conversation: conversation, stream: false, prompt: prompt)
    end

    private

    def run(capability, account:, conversation:, generation_id: nil, stream: false, **args, &on_delta)
      unless RateLimiter.consume!(account: account, capability: capability)
        return Result.new(status: "failed", error_code: "rate_limited", provider: "none", model: "none")
      end

      chain = ModelRegistry.chain_for(capability)
      last = Result.new(status: "failed", error_code: "upstream_failed", provider: "none", model: "none")
      chain.each_with_index do |entry, index|
        last = attempt(capability, entry, account: account, conversation: conversation,
                       generation_id: generation_id, last_in_chain: index == chain.size - 1,
                       streaming: stream, **args, &on_delta)
        return last if last.status == "success"
        break unless skippable?(last.error_code)

        rewind_io(args[:io])
      end
      last
    end

    def attempt(capability, entry, account:, conversation:, generation_id:, last_in_chain:, streaming:, **args, &on_delta)
      provider = ModelRegistry.provider_for(entry.provider)
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      accumulated = +""
      outcome = invoke(provider, capability, entry, generation_id, accumulated, streaming, args, &on_delta)
      latency = milliseconds(started)
      result = result_for(entry, outcome, accumulated)
      record_usage(account, conversation, capability, entry, result, latency, last_in_chain)
      result
    end

    def invoke(provider, capability, entry, generation_id, accumulated, streaming, args, &on_delta)
      return :unsupported if provider.nil?

      catch(:ai_cancelled) do
        call_provider(provider, capability, entry, streaming, args) do |delta|
          if generation_id && Cancellation.requested?(generation_id)
            Cancellation.clear!(generation_id)
            throw :ai_cancelled, :cancelled
          end
          accumulated << delta.to_s
          on_delta&.call(delta)
        end
      end
    end

    def call_provider(provider, capability, entry, streaming, args, &on_delta)
      case capability.to_sym
      when :transcribe
        provider.transcribe(io: args[:io], filename: args[:filename],
                            content_type: args[:content_type], model: entry.model)
      when :embedding
        provider.embed(texts: args[:texts], model: entry.model)
      when :image_gen
        provider.generate_image(prompt: args[:prompt], model: entry.model)
      else
        kwargs = { messages: args[:messages], model: entry.model, tools: args[:tools], images: args[:images] }
        streaming ? provider.stream_chat(**kwargs, &on_delta) : provider.chat(**kwargs)
      end
    end

    def result_for(entry, outcome, accumulated)
      if outcome.is_a?(Providers::Groq::Transcript)
        Result.new(transcript: outcome, status: "success", provider: entry.provider, model: entry.model)
      elsif outcome.is_a?(Provider::ChatResult)
        Result.new(text: outcome.text, status: "success", provider: entry.provider, model: entry.model,
                   prompt_tokens: outcome.prompt_tokens, completion_tokens: outcome.completion_tokens)
      elsif outcome.is_a?(Provider::EmbedResult)
        Result.new(vectors: outcome.vectors, status: "success", provider: entry.provider, model: entry.model)
      elsif outcome.is_a?(Provider::ImageResult)
        Result.new(image: outcome, status: "success", provider: entry.provider, model: entry.model)
      elsif outcome == :cancelled
        Result.new(text: accumulated, status: "success", provider: entry.provider, model: entry.model, cancelled: true)
      else
        Result.new(
          status: "failed", error_code: (outcome || :upstream_failed).to_s,
          provider: entry.provider, model: entry.model
        )
      end
    end

    def record_usage(account, conversation, capability, entry, result, latency, last_in_chain)
      AiUsageEvent.create!(
        account: account,
        conversation: conversation,
        capability: capability.to_s,
        provider: entry.provider,
        model: entry.model,
        prompt_tokens: result.prompt_tokens,
        completion_tokens: result.completion_tokens,
        latency_ms: latency,
        status: usage_status(result, last_in_chain),
        error_code: result.error_code
      )
    end

    def usage_status(result, last_in_chain)
      return "success" if result.status == "success"
      return "fallback" if skippable?(result.error_code) && !last_in_chain

      "failed"
    end

    def skippable?(error_code)
      SKIPPABLE.include?(error_code.to_s)
    end

    def rewind_io(io)
      io.rewind if io.respond_to?(:rewind)
    end

    def milliseconds(started)
      elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
      (elapsed * 1.second.in_milliseconds).round
    end
  end
end
