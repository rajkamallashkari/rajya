module ExportJobs
  class Create < ApplicationOperation
    def call(account:, conversation_id: nil, format: "json", include_media: false)
      value = format.to_s
      return failure(:validation_failed) unless ExportJob::FORMATS.include?(value)

      conversation = load_conversation(account, conversation_id)
      return conversation if conversation.is_a?(Result)
      return failure(:forbidden) if conversation&.restrict_forwarding

      job = ExportJob.create!(
        account: account,
        conversation: conversation,
        format: value,
        include_media: ActiveModel::Type::Boolean.new.cast(include_media) || false,
        status: "pending",
        expires_at: Settings.fetch(:export_artefact_ttl).seconds.from_now
      )
      GenerateJob.perform_later(job.id)
      success(job)
    end

    private

    def load_conversation(account, conversation_id)
      return if conversation_id.blank?

      conversation = Conversation.find_by(id: conversation_id)
      return failure(:not_found) if conversation.nil?
      return failure(:not_found) unless ConversationMembership.active.exists?(
        account_id: account.id, conversation_id: conversation.id
      )

      conversation
    end
  end
end
