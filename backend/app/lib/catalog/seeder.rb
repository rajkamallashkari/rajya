# Flattens config/locales/*.yml into translation_strings without clobbering
# an admin override (updated_by_user_id present).
module Catalog
  class Seeder
    def self.seed!(locale: I18n.default_locale)
      new(locale).seed!
    end

    def initialize(locale)
      @locale = locale.to_s
    end

    def seed!
      flatten(locale_hash).each do |key, value|
        row = TranslationString.find_or_initialize_by(key: key, locale: @locale)
        next if row.updated_by_user_id.present?

        row.value = value
        row.save!
      end
    end

    private

    def locale_hash
      path = Rails.root.join("config/locales/#{@locale}.yml")
      YAML.load_file(path).fetch(@locale)
    end

    def flatten(hash, prefix = nil)
      Catalog::Flat.from_hash(hash, prefix)
    end
  end
end
