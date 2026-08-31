module Conversations
  class UpdateWallpaper < ApplicationOperation
    def call(account:, conversation:, wallpaper:)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).organize?

      membership = View.membership_for(conversation, account)
      return failure(:not_found) if membership.blank?

      stored = stored_wallpaper(wallpaper)
      return stored unless stored_ok?(stored)

      membership.update!(wallpaper: stored)
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def stored_ok?(stored)
      !stored.is_a?(Result)
    end

    def stored_wallpaper(wallpaper)
      return nil if wallpaper.nil? || wallpaper == ""

      result = Preferences.apply({}, { "appearance" => { "wallpaper" => stringify(wallpaper) } })
      return failure(:validation_failed, details: result.errors) unless result.ok?

      Preferences.materialize(result.stored).dig("appearance", "wallpaper")
    end

    def stringify(value)
      return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
      return value if value.is_a?(Hash)

      value
    end
  end
end
