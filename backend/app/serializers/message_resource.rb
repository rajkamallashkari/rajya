class MessageResource < ApplicationResource
  attribute :id, &:id
  attribute :conversation_id, &:conversation_id
  attribute :position, &:position
  attribute :revision, &:revision
  attribute :kind, &:kind
  attribute :system_event, &:system_event
  attribute :forward_count, &:forward_count
  attribute :attachment_count, &:attachment_count
  attribute :reaction_summary, &:reaction_summary
  attribute :metadata, &:metadata
  attribute :sender_snapshot, &:sender_snapshot
  attribute :forwarded_from_account_id, &:forwarded_from_account_id
  attribute :client_nonce, &:client_nonce
  attribute :silent, &:silent
  attribute :edited_at, &:edited_at
  attribute :created_at, &:created_at
  attribute :tick do
    viewer = params[:current_account]
    next if viewer.blank?
    next unless object.sender_account_id == viewer.id

    snapshot = params[:tick_snapshot] || Messages::Ticks.snapshot_for(object.conversation)
    Messages::Ticks.call(message: object, viewer: viewer, snapshot: snapshot)
  end

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
    object.attachments.map { |attachment| AttachmentResource.new(attachment).to_h }
  end

  attribute :poll do
    next if object.deleted? || object.poll.nil?

    PollResource.new(object.poll, params: params).to_h
  end

  attribute :location do
    next if object.deleted? || object.message_location.nil?

    point = object.message_location
    {
      "latitude" => point.latitude.to_s,
      "longitude" => point.longitude.to_s,
      "accuracy_m" => point.accuracy_m,
      "label" => point.label
    }
  end

  attribute :contacts do
    next [] if object.deleted?

    object.message_contacts.sort_by(&:position).map do |card|
      {
        "contact_account_id" => card.contact_account_id,
        "display_name" => card.display_name,
        "phone" => card.phone,
        "email" => card.email,
        "position" => card.position
      }
    end
  end
end
