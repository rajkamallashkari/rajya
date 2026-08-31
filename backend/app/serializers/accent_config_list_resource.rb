class AccentConfigListResource < ApplicationResource
  attribute :accent_configs do
    object.accent_configs.map { |row| AccentConfigResource.new(row).to_h }
  end
end
