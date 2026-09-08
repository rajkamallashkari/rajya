class CallLogResource < ApplicationResource
  attribute :id do
    call.id
  end

  attribute :conversation_id do
    call.conversation_id
  end

  attribute :conversation_kind do
    object.conversation.kind
  end

  attribute :initiator_account_id do
    call.initiator_account_id
  end

  attribute :kind do
    call.kind
  end

  attribute :status do
    call.status
  end

  attribute :started_at do
    call.started_at
  end

  attribute :ended_at do
    call.ended_at
  end

  attribute :duration_seconds do
    call.duration_seconds
  end

  attribute :created_at do
    call.created_at
  end

  attribute :title do
    object.title
  end

  attribute :peer do
    peer = object.peer
    peer && AccountResource.new(peer).to_h
  end

  attribute :participants do
    call.call_participants.map { |row| CallParticipantResource.new(row).to_h }
  end

  private

  def call
    object.call
  end
end
