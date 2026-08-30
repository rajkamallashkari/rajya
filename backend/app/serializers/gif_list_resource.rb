class GifListResource < ApplicationResource
  attribute :gifs do
    object.gifs.map { |row| GifResource.new(row).to_h }
  end
end
