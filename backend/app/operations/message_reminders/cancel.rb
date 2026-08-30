module MessageReminders
  class Cancel < ApplicationOperation
    def call(reminder:, actor:)
      return failure(:forbidden) unless reminder.account_id == actor.id

      reminder.destroy!
      success(true)
    end
  end
end
