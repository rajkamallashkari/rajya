class BotListResource < ApplicationResource
  attribute :bots do
    object.bots.map { |bot| BotResource.new(bot).to_h }
  end
end
