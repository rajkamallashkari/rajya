class MessageReminderListResource < ApplicationResource
  attribute :message_reminders do
    object.message_reminders.map { |row| MessageReminderResource.new(row).to_h }
  end
end
