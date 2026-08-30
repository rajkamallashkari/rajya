module Storage
  module Mime
    module_function

    def sniff(blob)
      blob.open do |file|
        Marcel::MimeType.for(file, name: blob.filename.to_s)
      end
    end

    def blocked?(filename, content_type)
      ext = File.extname(filename.to_s.downcase)
      return true if Array(Settings.fetch(:blocked_upload_extensions)).include?(ext)

      type = content_type.to_s
      Array(Settings.fetch(:blocked_mime_prefixes)).any? { |prefix| type.start_with?(prefix) }
    end

    def cap_category(content_type)
      type = content_type.to_s.downcase
      return "image" if type.start_with?("image/")
      return "video" if type.start_with?("video/")
      return "audio" if type.start_with?("audio/")

      "other"
    end

    def byte_cap_for(content_type)
      caps = Settings.fetch(:file_caps)
      caps.fetch(cap_category(content_type), caps.fetch("other"))
    end
  end
end
