module Admin
  module Settings
    List = Struct.new(:settings, :unregistered_keys, keyword_init: true)
    Item = Struct.new(:setting, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(settings: ::Settings.listed, unregistered_keys: ::Settings.unregistered_keys))
      end
    end

    class Update < ApplicationOperation
      def call(admin:, key:, value:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: unknown) unless ::Settings::Registry.registered?(key)

        definition = ::Settings::Registry.fetch(key.to_sym)
        row = AppSetting.find_or_initialize_by(key: key.to_s)
        row.category = definition.fetch(:category).to_s
        row.value = value
        row.updated_by_user = admin
        return failure(:validation_failed, details: row.errors.to_hash) unless row.save

        success(Item.new(setting: listed_row(key)))
      end

      private

      def listed_row(key)
        ::Settings.listed.find { |entry| entry.fetch("key") == key.to_s }
      end

      def unknown
        { "key" => [ Catalog.t("errors.models.app_setting.unknown_key") ] }
      end
    end

    class Destroy < ApplicationOperation
      def call(admin:, key:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: unknown) unless ::Settings::Registry.registered?(key)

        AppSetting.find_by(key: key.to_s)&.destroy!
        success(Item.new(setting: listed_row(key)))
      end

      private

      def listed_row(key)
        ::Settings.listed.find { |entry| entry.fetch("key") == key.to_s }
      end

      def unknown
        { "key" => [ Catalog.t("errors.models.app_setting.unknown_key") ] }
      end
    end
  end
end
