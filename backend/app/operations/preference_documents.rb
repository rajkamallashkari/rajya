module PreferenceDocuments
  View = Struct.new(:data, :updated_at, keyword_init: true)

  class Show < ApplicationOperation
    def call(account:)
      record = account.preference || account.create_preference!(data: {})
      success(View.new(data: Preferences.materialize(record.data), updated_at: record.updated_at))
    end
  end

  class Update < ApplicationOperation
    def call(account:, patch:)
      record = account.preference || account.create_preference!(data: {})
      result = Preferences.apply(record.data, patch)
      return failure(:validation_failed, details: result.errors) unless result.ok?
      return failure(:validation_failed, details: font_details) unless fonts_exist?(result.stored)

      record.update!(data: result.stored)
      Show.call(account: account)
    end

    private

    def fonts_exist?(stored)
      ids = [
        stored.dig("appearance", "font_config_id"),
        stored.dig("appearance", "chat_font_config_id")
      ].compact.uniq
      return true if ids.empty?

      FontConfig.where(id: ids).count == ids.size
    end

    def font_details
      { "appearance.font_config_id" => [ Catalog.t("errors.models.preference.unknown_font") ] }
    end
  end
end
