class BlockListResource < ApplicationResource
  attribute :blocks do
    object.blocks.map { |block| BlockResource.new(block).to_h }
  end
end
