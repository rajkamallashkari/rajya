class AttachmentResource < ApplicationResource
  attributes :id, :kind, :content_type, :byte_size, :width, :height, :duration_ms, :blurhash, :waveform,
             :processing_status, :transcript, :transcript_status, :transcript_language

  attribute :processing_error do
    next if object.processing_error.blank?

    Catalog.t("media.processing.#{object.processing_error}")
  end

  attribute :filename do
    object.file.attached? ? object.file.filename.to_s : nil
  end
end
