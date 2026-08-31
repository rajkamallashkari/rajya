module Ai
  RewriteResult = Struct.new(:text, :suggested_chips, keyword_init: true)
  CHIPS_PREFIX = "CHIPS:"

  class Rewrite < ApplicationOperation
    def call(account:, text:, tones: [], instruction: nil, conversation: nil)
      draft = text.to_s.strip
      return failure(:validation_failed) if draft.blank?

      selected = Array(tones).map { |tone| tone.to_s.strip }.compact_blank
      note = instruction.to_s.strip
      return failure(:validation_failed) if selected.empty? && note.blank?

      outcome = Complete.call(
        account: account, capability: :rewrite, conversation: conversation,
        messages: [
          { role: "system", content: system_prompt(account) },
          { role: "user", content: user_prompt(draft, selected, note) }
        ]
      )
      return outcome unless outcome.success?

      body, chips = split_chips(outcome.value.text)
      return failure(:upstream_failed) if body.blank?

      success(RewriteResult.new(text: body, suggested_chips: chips))
    end

    private

    def system_prompt(account)
      [ PromptTemplate.fetch(:rewrite), StyleContext.prompt_for(account) ].compact.join("\n\n")
    end

    def user_prompt(draft, tones, note)
      parts = []
      # rubocop:disable Rajya/NoUserFacingStrings -- model prompt, not UI copy
      parts << "Tones: #{tones.join(", ")}" if tones.any?
      parts << "Instruction: #{note}" if note.present?
      parts << "Draft:\n#{draft}"
      parts << "After the rewrite, output a line starting with #{CHIPS_PREFIX} and up to " \
               "#{Ai::Limits.rewrite_chip_count} comma-separated follow-up tone suggestions."
      # rubocop:enable Rajya/NoUserFacingStrings
      parts.join("\n")
    end

    def split_chips(raw)
      lines = raw.to_s.strip.lines.map(&:strip)
      chip_line = lines.reverse.find { |line| line.start_with?(CHIPS_PREFIX) }
      chips = []
      if chip_line
        chips = chip_line.delete_prefix(CHIPS_PREFIX).split(",").map(&:strip).compact_blank
                         .first(Ai::Limits.rewrite_chip_count)
        lines = lines.reject { |line| line.start_with?(CHIPS_PREFIX) }
      end
      [ lines.join("\n").strip, chips ]
    end
  end
end
