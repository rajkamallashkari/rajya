class GenerationResource < ApplicationResource
  attribute :generation_id do
    object.fetch(:generation_id)
  end
end
