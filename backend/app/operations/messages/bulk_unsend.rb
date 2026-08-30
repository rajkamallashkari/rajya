module Messages
  class BulkUnsend < ApplicationOperation
    def call(actor:, message_ids:)
      ids = Array(message_ids).compact
      return failure(:validation_failed) if ids.empty? || ids.size > Settings.fetch(:multi_select_cap)

      rows = MessagePolicy::Scope.new(actor, Message.all).resolve.where(id: ids).includes(:conversation).to_a
      by_id = rows.index_by(&:id)
      return failure(:not_found) if ids.any? { |id| by_id[id.to_i].nil? }

      ordered = ids.map { |id| by_id[id.to_i] }
      ordered.each do |message|
        return failure(:forbidden) unless MessagePolicy.new(actor, message).destroy?
        return failure(:conflict) if message.deleted?
        return failure(:forbidden) unless within_window?(message)
      end

      Message.transaction do
        ordered.each { |message| Unsend.call(message: message, actor: actor) }
      end
      success(List.new(messages: ordered.map(&:reload)))
    end

    private

    def within_window?(message)
      window = Settings.fetch(:unsend_window)
      return true if window.nil?

      message.created_at >= window.seconds.ago
    end
  end
end
