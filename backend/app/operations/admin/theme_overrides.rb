module Admin
  module ThemeOverrides
    List = Struct.new(:themes, keyword_init: true)
    Item = Struct.new(:override, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(themes: Theme::Overrides.admin_listing))
      end
    end

    class Upsert < ApplicationOperation
      def call(admin:, theme:, token_name:, value:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: primitive(token_name)) unless Theme::Tokens.overridable?(token_name)

        row = ThemeOverride.find_or_initialize_by(theme: theme.to_s, token_name: token_name)
        row.value = value
        row.updated_by_user = admin
        return failure(:validation_failed, details: contrast_details(row)) unless row.save

        success(Item.new(override: listed_token(theme, token_name)))
      end

      private

      def listed_token(theme, token_name)
        Theme::Overrides.tokens_for(theme.to_s).find { |entry| entry.fetch("token_name") == token_name }
      end

      def primitive(token_name)
        {
          "token_name" => [ Catalog.t("errors.models.theme_override.primitive") ],
          "pair" => { "token" => token_name }
        }
      end

      def contrast_details(row)
        details = row.errors.to_hash.stringify_keys
        details["pair"] = row.contrast_pair if row.errors[:value].present?
        details
      end
    end

    class Reset < ApplicationOperation
      def call(admin:, theme: nil, token_name: nil)
        return failure(:forbidden) unless admin.is_admin?

        scope = ThemeOverride.all
        scope = scope.where(theme: theme) if theme.present?
        scope = scope.where(token_name: token_name) if token_name.present?
        scope.find_each(&:destroy!)
        success(List.new(themes: Theme::Overrides.admin_listing))
      end
    end
  end
end
