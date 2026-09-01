class AdminThemeOverrideResource < ApplicationResource
  attribute :override do
    object.override
  end
end
