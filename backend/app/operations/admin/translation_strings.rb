module Admin
  module TranslationStrings
    List = Struct.new(:translation_strings, keyword_init: true)
    Item = Struct.new(:translation_string, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:, locale: "en", query: nil, surface: nil)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(translation_strings: Catalog.listing(locale: locale.to_s, query: query, surface: surface)))
      end
    end

    class Update < ApplicationOperation
      def call(admin:, key:, value:, locale: "en")
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: blank) if key.to_s.blank? || value.to_s.blank?

        row = TranslationString.find_or_initialize_by(key: key.to_s, locale: locale.to_s)
        row.value = value
        row.updated_by_user = admin
        return failure(:validation_failed, details: row.errors.to_hash) unless row.save

        success(Item.new(translation_string: listed_row(key, locale)))
      end

      private

      def listed_row(key, locale)
        Catalog.listing(locale: locale.to_s).find { |entry| entry.fetch("key") == key.to_s }
      end

      def blank
        { "value" => [ Catalog.t("errors.models.translation_string.blank") ] }
      end
    end

    class Destroy < ApplicationOperation
      def call(admin:, key:, locale: "en")
        return failure(:forbidden) unless admin.is_admin?

        default = Catalog::Flat.locale_defaults(locale.to_s)[key.to_s]
        row = TranslationString.find_by(key: key.to_s, locale: locale.to_s)
        if row && default
          row.update!(value: default, updated_by_user: nil)
        else
          row&.destroy!
        end

        success(Item.new(translation_string: listed_row(key, locale)))
      end

      private

      def listed_row(key, locale)
        Catalog.listing(locale: locale.to_s).find { |entry| entry.fetch("key") == key.to_s }
      end
    end
  end
end
