class ScheduledMessageListResource < ApplicationResource
  attribute :scheduled_messages do
    object.scheduled_messages.map { |row| ScheduledMessageResource.new(row).to_h }
  end
end
