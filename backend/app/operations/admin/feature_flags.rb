module Admin
  module FeatureFlags
    List = Struct.new(:feature_flags, :unregistered_keys, keyword_init: true)
    Item = Struct.new(:feature_flag, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(feature_flags: FeatureFlag.listed, unregistered_keys: FeatureFlag.unregistered_keys))
      end
    end

    class Update < ApplicationOperation
      def call(admin:, key:, enabled:, rollout: {})
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed, details: unknown) unless FeatureFlagRegistry.registered?(key)

        row = FeatureFlag.find_or_initialize_by(key: key.to_s)
        row.description = FeatureFlagRegistry.description_for(key)
        row.enabled = enabled
        row.rollout = rollout.presence || {}
        row.updated_by_user = admin
        return failure(:validation_failed, details: row.errors.to_hash) unless row.save

        success(Item.new(feature_flag: listed_row(key)))
      end

      private

      def listed_row(key)
        FeatureFlag.listed.find { |entry| entry.fetch("key") == key.to_s }
      end

      def unknown
        { "key" => [ Catalog.t("errors.models.feature_flag.unknown_key") ] }
      end
    end
  end
end
