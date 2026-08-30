module Messages
  class BulkSave < ApplicationOperation
    def call(actor:, message_ids:)
      ids = Array(message_ids).compact
      return failure(:validation_failed) if ids.empty? || ids.size > Settings.fetch(:multi_select_cap)

      rows = MessagePolicy::Scope.new(actor, Message.all).resolve.where(id: ids).includes(:conversation).to_a
      by_id = rows.index_by(&:id)
      return failure(:not_found) if ids.any? { |id| by_id[id.to_i].nil? }

      ordered = ids.map { |id| by_id[id.to_i] }
      ordered.each do |message|
        return failure(:forbidden) unless MessagePolicy.new(actor, message).save?
        return failure(:not_found) if message.deleted?
      end

      saved = Message.transaction do
        ordered.map { |message| Save.call(message: message, actor: actor).value }
      end
      success(SavedList.new(saved_messages: saved))
    end
  end
end
