module Messages
  class BulkForward < ApplicationOperation
    def call(actor:, message_ids:, target:)
      ids = Array(message_ids).compact
      return failure(:validation_failed) if ids.empty? || ids.size > Settings.fetch(:multi_select_cap)
      return failure(:forbidden) unless ConversationPolicy.new(actor, target).send?

      rows = MessagePolicy::Scope.new(actor, Message.all).resolve.where(id: ids).includes(:conversation).to_a
      by_id = rows.index_by(&:id)
      return failure(:not_found) if ids.any? { |id| by_id[id.to_i].nil? }

      ordered = ids.map { |id| by_id[id.to_i] }
      ordered.each do |message|
        return failure(:forbidden) unless MessagePolicy.new(actor, message).forward?
        return failure(:not_found) if message.deleted?
      end

      copies = Message.transaction do
        ordered.map { |message| Forward.call(message: message, actor: actor, target: target).value }
      end
      success(List.new(messages: copies))
    end
  end
end
