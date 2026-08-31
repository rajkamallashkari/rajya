class FontConfigListResource < ApplicationResource
  attribute :font_configs do
    object.font_configs.map { |row| FontConfigResource.new(row).to_h }
  end
end
