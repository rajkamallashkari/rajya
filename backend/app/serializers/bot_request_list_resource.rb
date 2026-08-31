class BotRequestListResource < ApplicationResource
  attribute :bot_requests do
    object.bot_requests.map { |row| BotRequestResource.new(row).to_h }
  end
end
