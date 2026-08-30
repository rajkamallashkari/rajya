class MessageReminderResource < ApplicationResource
  attributes :id, :message_id, :remind_at, :note, :completed_at, :created_at
end
