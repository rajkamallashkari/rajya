require "open3"

module Attachments
  class Process < ApplicationOperation
    def call(attachment_id: nil, attachment: nil)
      record = attachment || Attachment.find_by(id: attachment_id)
      return success(record) if record.nil? || !record.file.attached?

      sniff!(record)
      process_kind!(record)
      record.update!(processing_status: "ready", processing_error: nil)
      enqueue_transcription!(record)
      publish(record)
      success(record)
    rescue PermanentFailure => error
      fail_record!(record, error.message)
      success(record)
    end

    def fail_record!(record, code)
      return if record.nil?

      record.update!(processing_status: "failed", processing_error: code)
      publish(record)
    end

    private

    def sniff!(record)
      sniffed = Storage::Mime.sniff(record.file.blob)
      kind = record.voice? ? "voice" : Attachment.kind_for(sniffed)
      record.update!(content_type: sniffed, kind: kind)
      raise PermanentFailure, "blocked_type" if Storage::Mime.blocked?(record.file.filename.to_s, sniffed)
    end

    def process_kind!(record)
      case record.kind
      when "image" then process_image(record)
      when "video" then process_video(record)
      when "audio" then process_audio(record)
      when "voice" then process_voice(record)
      when "file" then process_file(record)
      end
    end

    def process_image(record)
      require "vips"
      blob = record.file.blob
      blob.open do |tempfile|
        image = Vips::Image.new_from_file(tempfile.path)
        record.update!(width: image.width, height: image.height, blurhash: blurhash_for(tempfile.path))
      end
      process_variants(record)
    rescue LoadError, Vips::Error
      raise PermanentFailure, "unreadable"
    end

    def process_variants(record)
      dims = Settings.fetch(:image_variant_dimensions)
      quality = Settings.fetch(:image_variant_quality)
      %w[thumb preview].each do |name|
        size = dims.fetch(name)
        record.file.blob.variant(
          resize_to_limit: [ size, size ],
          format: :webp,
          saver: { quality: quality.fetch(name) }
        ).processed
      end
    end

    def blurhash_for(path)
      return unless defined?(Blurhash)

      size = Settings.fetch(:image_variant_dimensions).fetch("thumb")
      thumb = ImageProcessing::Vips.source(path).resize_to_fit(size, size).convert("png").call
      image = Vips::Image.new_from_file(thumb.path).cast(:uchar)
      # rubocop:disable Rajya/NoMagicNumbers -- RGB is 3 bands; add alpha for Blurhash's RGBA input
      image = image.add_alpha if image.bands == 3
      # rubocop:enable Rajya/NoMagicNumbers
      Blurhash.encode(
        image.width, image.height, image.write_to_memory.unpack("C*"),
        x_comp: Settings.fetch(:blurhash_x_components),
        y_comp: Settings.fetch(:blurhash_y_components)
      )
    rescue StandardError
      nil
    ensure
      thumb&.close
      thumb&.unlink
    end

    def process_video(record)
      require_ffmpeg!
      record.file.blob.open do |tempfile|
        probe = probe_media(tempfile.path)
        stream = Array(probe[:streams]).find { |row| row[:codec_type] == "video" }
        duration = probe.dig(:format, :duration)&.to_f
        record.update!(
          width: stream&.dig(:width),
          height: stream&.dig(:height),
          duration_ms: milliseconds(duration)
        )
        attach_video_thumbnail(record, tempfile.path)
      end
    end

    def attach_video_thumbnail(record, video_path)
      out_path = File.join(Dir.tmpdir, "thumb_#{SecureRandom.uuid}.webp")
      quality = Settings.fetch(:image_variant_quality).fetch("thumb").to_s
      ok = system(
        "ffmpeg", "-y", "-i", video_path, "-vframes", "1", "-quality", quality, out_path,
        exception: false
      )
      return unless ok && File.exist?(out_path)

      record.thumbnail.attach(
        io: File.open(out_path),
        filename: "thumb.webp",
        content_type: "image/webp",
        service_name: record.file.blob.service_name
      )
    ensure
      File.unlink(out_path) if out_path && File.exist?(out_path)
    end

    def process_audio(record)
      return if record.duration_ms.present?

      require_ffmpeg!
      record.file.blob.open do |tempfile|
        duration = probe_media(tempfile.path).dig(:format, :duration)&.to_f
        record.update!(duration_ms: milliseconds(duration)) if duration
      end
    end

    def process_voice(record)
      return if record.duration_ms.present? && record.waveform.present?

      process_audio(record)
    end

    def process_file(record)
      return unless record.pdf?

      dims = Settings.fetch(:image_variant_dimensions)
      quality = Settings.fetch(:image_variant_quality)
      size = dims.fetch("thumb")
      record.file.blob.variant(
        resize_to_limit: [ size, size ],
        format: :webp,
        saver: { quality: quality.fetch("thumb") }
      ).processed
    rescue StandardError
      raise PermanentFailure, "unreadable"
    end

    def require_ffmpeg!
      raise PermanentFailure, "ffmpeg_missing" unless ffmpeg_available?
    end

    def ffmpeg_available?
      Open3.capture2e("ffmpeg", "-version").last.success? &&
        Open3.capture2e("ffprobe", "-version").last.success?
    rescue Errno::ENOENT
      false
    end

    def probe_media(path)
      out, status = Open3.capture2("ffprobe", "-v", "quiet", "-print_format", "json",
                                   "-show_format", "-show_streams", path)
      raise PermanentFailure, "probe_failed" unless status.success?

      JSON.parse(out, symbolize_names: true)
    rescue JSON::ParserError
      raise PermanentFailure, "probe_failed"
    end

    def milliseconds(duration)
      return if duration.nil?

      (duration * 1.second.in_milliseconds).round
    end

    def enqueue_transcription!(record)
      return unless record.voice?
      return unless FeatureFlag.enabled?(:voice_transcription, account: record.message&.sender_account)

      record.update!(transcript_status: "pending")
      TranscribeJob.perform_later(record.id)
    end

    def publish(record)
      message = record.message
      return if message.nil?

      Realtime.publish(
        message.conversation, :attachment_processed,
        "message_id" => message.id, "attachment_id" => record.id
      )
    end
  end
end
