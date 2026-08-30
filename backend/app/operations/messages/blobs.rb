module Messages
  # Attach already-uploaded blobs to a message. Invalid signed ids are skipped
  # silently (BR-17); the cap comes from Settings (BR-16). Voice duration and
  # waveform live on the attachment so playback does not wait on P7 processing.
  module Blobs
    module_function

    def attach!(message, signed_ids:, voice: false, voice_duration_ms: nil, voice_waveform: nil)
      created = 0
      Array(signed_ids).compact_blank.first(Settings.fetch(:attachments_per_message)).each do |signed_id|
        blob = ActiveStorage::Blob.find_signed(signed_id)
        next if blob.nil?

        attachment = message.attachments.create!(attrs_for(blob, voice:, voice_duration_ms:, voice_waveform:))
        attachment.file.attach(blob)
        bind_bucket!(attachment, blob)
        StorageQuotas::Charge.call(account: message.sender_account, blob: blob, bucket: attachment.storage_bucket)
        Attachments::ProcessJob.perform_later(attachment.id)
        created += 1
      end
      message.update_column(:attachment_count, created)
      created
    end

    def copy!(source, target)
      source.attachments.find_each do |original|
        copy = target.attachments.create!(
          kind: original.kind,
          content_type: original.content_type,
          byte_size: original.byte_size,
          checksum: original.checksum,
          width: original.width,
          height: original.height,
          duration_ms: original.duration_ms,
          blurhash: original.blurhash,
          waveform: original.waveform,
          processing_status: original.processing_status,
          storage_bucket_id: original.storage_bucket_id
        )
        copy.file.attach(original.file.blob) if original.file.attached?
      end
      target.update_column(:attachment_count, source.attachment_count)
    end

    def attrs_for(blob, voice:, voice_duration_ms:, voice_waveform:)
      attrs = {
        kind: voice ? "voice" : Attachment.kind_for(blob.content_type),
        content_type: blob.content_type,
        byte_size: blob.byte_size,
        checksum: blob.checksum
      }
      return attrs unless voice

      attrs.merge(duration_ms: voice_duration_ms, waveform: normalize_waveform(voice_waveform))
    end

    def bind_bucket!(attachment, blob)
      bucket = StorageBucket.find_by(service_name: blob.service_name)
      attachment.update_column(:storage_bucket_id, bucket.id) if bucket
    end

    def normalize_waveform(raw)
      return if raw.blank?

      data = raw.is_a?(Array) ? raw : JSON.parse(raw.to_s)
      return unless data.is_a?(Array)

      data.first(Settings.fetch(:waveform_peak_count)).map { |value| value.to_f.clamp(0.0, 1.0) }
    rescue JSON::ParserError
      nil
    end
  end
end
