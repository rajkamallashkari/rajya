class AttachmentResource < ApplicationResource
  attributes :id, :kind, :content_type, :byte_size, :width, :height, :duration_ms, :blurhash, :waveform,
             :transcript, :transcript_language

  attribute :processing_status do
    object.visible_processing_status
  end

  attribute :processing_stalled do
    object.processing_stalled?
  end

  attribute :original_available do
    object.file.attached?
  end

  attribute :transcript_status do
    object.visible_transcript_status
  end

  attribute :processing_error do
    error = object.visible_processing_error
    next if error.blank?

    Catalog.t("media.processing.#{error}")
  end

  attribute :filename do
    object.file.attached? ? object.file.filename.to_s : nil
  end
end
