module Bots
  ImportResult = Struct.new(:created, :updated, :errors, keyword_init: true)

  # rubocop:disable Rajya/NoUserFacingStrings -- importer diagnostics and SQL, not UI copy
  class Import < ApplicationOperation
    def call(entries = Personas::ENTRIES)
      created = 0
      updated = 0
      errors = []
      Array(entries).each_with_index do |raw, index|
        result = upsert(raw)
        case result
        when :created then created += 1
        when :updated then updated += 1
        else errors << "Row #{index + 1}: #{result}"
        end
      end
      success(ImportResult.new(created: created, updated: updated, errors: errors))
    end

    private

    def upsert(raw)
      attrs = raw.to_h.symbolize_keys
      username = attrs[:username].to_s.strip
      return "missing username" if username.blank?
      return "invalid username" unless Auth::Usernames.valid_format?(username)

      prompt = attrs[:persona_prompt].to_s.strip
      return "persona prompt too short" if prompt.length < Ai::Limits.prompt_minimum_length

      account = Account.find_by("LOWER(username) = ?", username.downcase)
      if account&.human?
        return "username belongs to a human"
      end

      if account.nil?
        account = Account.create!(kind: "bot", username: username, display_name: attrs[:name].presence || username,
                                  bio: attrs[:bio].to_s)
        Bot.create!(account: account, persona_prompt: prompt, owner_account: nil)
        :created
      else
        account.update!(display_name: attrs[:name].presence || account.display_name, bio: attrs[:bio].to_s)
        bot = account.bot || account.create_bot!(persona_prompt: prompt, owner_account: nil)
        bot.update!(persona_prompt: prompt, owner_account: nil)
        :updated
      end
    rescue ActiveRecord::RecordInvalid => e
      e.record.errors.full_messages.join(", ")
    end
  end
  # rubocop:enable Rajya/NoUserFacingStrings
end
