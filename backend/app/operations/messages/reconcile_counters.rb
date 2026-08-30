module Messages
  class ReconcileCounters < ApplicationOperation
    def call(message: nil)
      scope = message ? Message.where(id: message.id) : Message.all
      scope.find_each { |row| repair(row) }
      success(true)
    end

    private

    def repair(message)
      message.update_columns(
        reaction_summary: message.reactions.group(:emoji).count,
        attachment_count: message.attachments.count
      )
      Polls::Counters.refresh!(message.poll) if message.poll
    end
  end
end
