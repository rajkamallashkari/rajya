class AdminFeatureFlagResource < ApplicationResource
  attribute :feature_flag do
    object.feature_flag
  end
end
