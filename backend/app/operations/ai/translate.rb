module Ai
  Translation = Struct.new(:text, :source_language, :target_language, :cached, keyword_init: true)

  class Translate < ApplicationOperation
    def call(account:, message:, target_language:, source_language: nil)
      return failure(:not_found) unless FeatureFlag.enabled?(:ai_translate, account: account)
      return failure(:not_found) if message.nil? || message.deleted? || message.body.blank?

      lang = target_language.to_s.strip.downcase
      return failure(:validation_failed) if lang.blank?

      cached = cached_for(message, lang, source_language)
      return success(cached) if cached

      outcome = Complete.call(
        account: account, capability: :translate, conversation: message.conversation,
        messages: [
          { role: "system", content: PromptTemplate.fetch(:translate) },
          { role: "user", content: translate_prompt(message.body, lang, source_language) }
        ]
      )
      return outcome unless outcome.success?

      source = source_language.to_s.strip.presence || "auto"
      store!(message, lang, outcome.value.text, source)
      success(Translation.new(
                text: outcome.value.text.strip, source_language: source,
                target_language: lang, cached: false
              ))
    end

    private

    def cached_for(message, lang, source_language)
      return if message.edited_at.present? || source_language.present?

      entry = translations(message)[lang]
      return unless entry.is_a?(Hash) && entry["text"].present?

      Translation.new(
        text: entry["text"], source_language: entry["source_language"].to_s.presence || "auto",
        target_language: lang, cached: true
      )
    end

    def store!(message, lang, text, source)
      payload = message.metadata.is_a?(Hash) ? message.metadata.deep_dup : {}
      payload["translations"] ||= {}
      payload["translations"][lang] = { "text" => text.strip, "source_language" => source }
      message.update!(metadata: payload)
    end

    def translations(message)
      meta = message.metadata
      return {} unless meta.is_a?(Hash)

      stored = meta["translations"]
      stored.is_a?(Hash) ? stored : {}
    end

    def translate_prompt(body, lang, source)
      from = source.to_s.strip
      # rubocop:disable Rajya/NoUserFacingStrings -- model prompt, not UI copy
      prefix = from.present? ? "From #{from} into #{lang}:" : "Detect the source language and translate into #{lang}:"
      # rubocop:enable Rajya/NoUserFacingStrings
      "#{prefix}\n#{body}"
    end
  end
end
