class BotRequestListResource < ApplicationResource
  attribute :bot_requests do
    object.bot_requests.map { |row| BotRequestResource.new(row, params: params).to_h }
  end
end
