# Capability → ordered provider/model chain (TARGET §6.3, NR-8). Truncated by
# ai_fallback_attempt_cap so a runaway list cannot burn the floor.
module Ai
  class ModelRegistry
    UnregisteredCapability = Class.new(StandardError)
    Entry = Struct.new(:provider, :model, keyword_init: true)

    CHAINS = {
      bot_reply: :ai_bot_reply_models,
      rewrite: :ai_rewrite_models,
      translate: :ai_translate_models,
      suggest_replies: :ai_suggest_replies_models,
      summarize: :ai_summarize_models,
      transcribe: :ai_transcribe_models,
      embedding: :ai_embedding_models,
      vision: :ai_vision_models,
      image_gen: :ai_image_gen_models,
      memory_extract: :ai_rewrite_models,
      style_profile: :ai_style_profile_models
    }.freeze

    PROVIDERS = {
      "groq" => -> { Ai::Providers::Groq.new },
      "gemini" => -> { Ai::Providers::Gemini.new },
      "ollama" => -> { Ai::Providers::Ollama.new },
      "openrouter" => -> { Ai::Providers::OpenRouter.new }
    }.freeze

    class << self
      def chain_for(capability)
        capability = capability.to_sym
        key = CHAINS[capability]
        unless key
          raise UnregisteredCapability, capability.to_s if Rails.env.local?

          return []
        end

        entries = Array(Settings.fetch(key)).filter_map { |token| parse(token) }
        cap = Settings.fetch(:ai_fallback_attempt_cap)
        entries.take(1 + cap)
      end

      def provider_for(name)
        factory = PROVIDERS[name.to_s]
        factory&.call
      end

      def registered?(capability)
        CHAINS.key?(capability.to_sym)
      end

      private

      def parse(token)
        provider, model = token.to_s.split("/", 2)
        return if provider.blank? || model.blank?

        Entry.new(provider: provider, model: model)
      end
    end
  end
end
