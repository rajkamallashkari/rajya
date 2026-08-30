module StorageQuotas
  module_function

  def blob_uses(blob)
    ActiveStorage::Attachment.where(blob_id: blob.id).count + Sticker.where(blob_id: blob.id).count
  end
end
