class BotListResource < ApplicationResource
  attribute :bots do
    object.bots.map { |bot| BotResource.new(bot, params: params).to_h }
  end
end
