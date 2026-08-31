class CallResource < ApplicationResource
  attributes :id, :conversation_id, :initiator_account_id, :kind, :status,
             :started_at, :ended_at, :duration_seconds, :created_at

  attribute :participants do
    object.call_participants.map { |row| CallParticipantResource.new(row).to_h }
  end
end
