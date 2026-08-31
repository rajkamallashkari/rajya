# Cached prompt lookup (TARGET_ARCHITECTURE.md §7.1). Code ships defaults;
# the highest active `prompt_templates` row for a capability wins.
module Ai
  class PromptTemplate
    UnregisteredCapability = Class.new(StandardError)
    CACHE_PREFIX = "rajya/prompts"

    DEFAULTS = {
      bot_reply: "You are a helpful assistant in a private chat. Stay in the bot's persona.",
      rewrite: "Rewrite the user's draft. Preserve meaning. Apply the requested tone.",
      summarize: "Summarize the conversation concisely for someone catching up.",
      suggest_replies: "Suggest short reply options the user might send.",
      translate: "Translate the message. Preserve formatting markers from the restricted set.",
      style_profile: "Describe the writer's style from the supplied messages. Be concise."
    }.freeze

    class << self
      def fetch(capability)
        capability = capability.to_sym
        unless DEFAULTS.key?(capability)
          raise UnregisteredCapability, capability.to_s if Rails.env.local?

          return capability.to_s
        end

        Rails.cache.fetch(cache_key(capability)) { load_template(capability) }
      end

      def invalidate(capability)
        Rails.cache.delete(cache_key(capability.to_sym))
      end

      private

      def cache_key(capability)
        "#{CACHE_PREFIX}/#{capability}"
      end

      def load_template(capability)
        row = ::PromptTemplate.where(capability: capability.to_s, active: true).order(version: :desc).first
        row&.template || DEFAULTS.fetch(capability)
      end
    end
  end
end
