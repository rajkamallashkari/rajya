class GalleryAttachmentResource < AttachmentResource
  attribute :message_id do
    object.message_id
  end
end
