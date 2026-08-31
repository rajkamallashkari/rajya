module Ai
  class TranslateText < ApplicationOperation
    def call(account:, text:, target_language:, source_language: nil)
      body = text.to_s.strip
      lang = target_language.to_s.strip.downcase
      return failure(:validation_failed) if body.blank? || lang.blank?

      outcome = Complete.call(
        account: account, capability: :translate,
        messages: [
          { role: "system", content: PromptTemplate.fetch(:translate) },
          { role: "user", content: prompt(body, lang, source_language) }
        ]
      )
      return outcome unless outcome.success?

      source = source_language.to_s.strip.presence || "auto"
      success(Translation.new(
                text: outcome.value.text.strip, source_language: source,
                target_language: lang, cached: false
              ))
    end

    private

    def prompt(body, lang, source)
      from = source.to_s.strip
      # rubocop:disable Rajya/NoUserFacingStrings -- model prompt, not UI copy
      prefix = from.present? ? "From #{from} into #{lang}:" : "Detect the source language and translate into #{lang}:"
      # rubocop:enable Rajya/NoUserFacingStrings
      "#{prefix}\n#{body}"
    end
  end
end
