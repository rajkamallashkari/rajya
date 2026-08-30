module MessageReminders
  class DispatchDue < ApplicationOperation
    def call
      MessageReminder.due.find_each { |row| Dispatch.call(reminder: row) }
      success(true)
    end
  end
end
