class MessageResource < ApplicationResource
  attribute :id, &:id
  attribute :conversation_id, &:conversation_id
  attribute :position, &:position
  attribute :revision, &:revision
  attribute :kind, &:kind
  attribute :forward_count, &:forward_count
  attribute :attachment_count, &:attachment_count
  attribute :reaction_summary, &:reaction_summary
  attribute :metadata, &:metadata
  attribute :sender_snapshot, &:sender_snapshot
  attribute :forwarded_from_account_id, &:forwarded_from_account_id
  attribute :client_nonce, &:client_nonce
  attribute :edited_at, &:edited_at
  attribute :created_at, &:created_at

  attribute :body do
    object.deleted? ? nil : object.body
  end

  attribute :deleted do
    object.deleted?
  end

  attribute :sender do
    account = object.sender_account
    account && AccountResource.new(account).to_h
  end

  attribute :reply_to do
    parent = object.reply_to_message
    next unless parent

    snippet = {
      "id" => parent.id,
      "deleted" => parent.deleted?
    }
    next snippet if parent.deleted?

    snippet.merge("body" => parent.body.to_s[0, Settings.fetch(:reply_quote_length)])
  end

  attribute :attachments do
    object.attachments.map do |attachment|
      {
        "id" => attachment.id,
        "kind" => attachment.kind,
        "content_type" => attachment.content_type,
        "byte_size" => attachment.byte_size,
        "processing_status" => attachment.processing_status,
        "duration_ms" => attachment.duration_ms,
        "waveform" => attachment.waveform
      }
    end
  end
end
