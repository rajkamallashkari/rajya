module Ai
  class StyleContext
    def self.prompt_for(account)
      preference = account&.preference
      return unless preference&.style_profile_enabled?

      blob = preference.style_profile
      return if blob.blank?

      text = blob.is_a?(Hash) ? blob["global"].to_s : blob.to_s
      text = text.strip
      return if text.blank?

      # rubocop:disable Rajya/NoUserFacingStrings -- model prompt, not UI copy
      "Match this writing style: #{text}"
      # rubocop:enable Rajya/NoUserFacingStrings
    end
  end
end
