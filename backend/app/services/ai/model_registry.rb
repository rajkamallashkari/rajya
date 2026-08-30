# Capability → ordered provider/model chain (TARGET_ARCHITECTURE.md §6.3).
# Session 7.4 ships transcribe; P9.1 fills the remaining capabilities.
module Ai
  class ModelRegistry
    UnregisteredCapability = Class.new(StandardError)
    Entry = Struct.new(:provider, :model, keyword_init: true)

    class << self
      def chain_for(capability)
        capability = capability.to_sym
        unless capability == :transcribe
          raise UnregisteredCapability, capability.to_s if Rails.env.local?

          return []
        end

        Array(Settings.fetch(:ai_transcribe_models)).filter_map { |token| parse(token) }
      end

      def provider_for(name)
        return Ai::Providers::Groq.new if name.to_s == "groq"

        nil
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
