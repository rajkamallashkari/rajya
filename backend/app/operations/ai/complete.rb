module Ai
  # Shared completion wrapper for helper endpoints. Maps runner statuses onto
  # the error taxonomy and gates the matching feature flag.
  class Complete < ApplicationOperation
    FLAGS = {
      rewrite: :ai_rewrite,
      suggest_replies: :ai_smart_reply,
      translate: :ai_translate,
      summarize: :ai_summarize,
      style_profile: :ai_rewrite
    }.freeze

    def call(account:, capability:, messages:, conversation: nil)
      flag = FLAGS[capability.to_sym]
      return failure(:not_found) if flag && !FeatureFlag.enabled?(flag, account: account)

      result = Runner.chat(
        messages: messages, capability: capability, account: account, conversation: conversation
      )
      return failure(:rate_limited) if result.error_code == "rate_limited"
      return failure(:upstream_failed) if result.status != "success" || result.text.to_s.strip.blank?

      success(result)
    end
  end
end
