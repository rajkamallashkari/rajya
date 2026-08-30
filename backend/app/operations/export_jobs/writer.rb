require "base64"
require "erb"
require "json"

module ExportJobs
  class Writer
    def self.call(job:)
      new(job).call
    end

    def initialize(job)
      @job = job
    end

    def call
      conversations = Payload.call(account: @job.account, conversation: @job.conversation)
      case @job.format
      when "txt" then [ txt(conversations), filename("txt"), "text/plain" ]
      when "html" then [ html(conversations), filename("html"), "text/html" ]
      else [ json(conversations), filename("json"), "application/json" ]
      end
    end

    private

    def filename(ext)
      "rajya-export-#{@job.id}.#{ext}"
    end

    def json(conversations)
      JSON.pretty_generate(
        "exported_at" => Time.current.iso8601,
        "include_media" => @job.include_media,
        "conversations" => conversations.map { |row| json_conversation(row) }
      )
    end

    def json_conversation(row)
      {
        "id" => row.conversation.id,
        "title" => row.conversation.title,
        "kind" => row.conversation.kind,
        "messages" => row.messages.map { |message| json_message(message) }
      }
    end

    def json_message(message)
      payload = {
        "id" => message.id,
        "position" => message.position,
        "kind" => message.kind,
        "body" => message.deleted? ? nil : message.body,
        "deleted" => message.deleted?,
        "created_at" => message.created_at.iso8601,
        "sender" => message.sender_account&.display_name
      }
      payload["location"] = location_hash(message.message_location) if message.message_location
      payload["contacts"] = message.message_contacts.map { |card| contact_hash(card) }
      payload["attachments"] = message.attachments.map { |attachment| attachment_hash(attachment) }
      payload
    end

    def location_hash(point)
      { "latitude" => point.latitude.to_s, "longitude" => point.longitude.to_s, "label" => point.label }
    end

    def contact_hash(card)
      { "display_name" => card.display_name, "phone" => card.phone, "email" => card.email }
    end

    def attachment_hash(attachment)
      row = {
        "id" => attachment.id,
        "kind" => attachment.kind,
        "filename" => attachment.file.attached? ? attachment.file.filename.to_s : nil,
        "content_type" => attachment.content_type,
        "byte_size" => attachment.byte_size
      }
      row["data"] = media_data(attachment) if @job.include_media && attachment.file.attached?
      row
    end

    def media_data(attachment)
      Base64.strict_encode64(attachment.file.blob.download)
    end

    def txt(conversations)
      conversations.map { |row| txt_conversation(row) }.join("\n\n")
    end

    def txt_conversation(row)
      title = row.conversation.title.presence || "conversation-#{row.conversation.id}"
      lines = [ title ]
      row.messages.each do |message|
        stamp = message.created_at.utc.iso8601
        name = message.sender_account&.display_name || "system"
        body = message.deleted? ? "" : message.body.to_s
        lines << "[#{stamp}] #{name}: #{body}"
      end
      lines.join("\n")
    end

    def html(conversations)
      parts = conversations.map { |row| html_conversation(row) }.join
      wrap_html(parts)
    end

    def html_conversation(row)
      title = ERB::Util.html_escape(row.conversation.title.to_s)
      items = row.messages.map { |message| html_message(message) }.join
      "<section><h1>#{title}</h1>#{items}</section>"
    end

    # rubocop:disable Rajya/NoUserFacingStrings -- HTML artefact markup, not UI copy
    def wrap_html(parts)
      "<!DOCTYPE html><html><body>#{parts}</body></html>"
    end

    def html_message(message)
      name = ERB::Util.html_escape(message.sender_account&.display_name.to_s)
      body = ERB::Util.html_escape(message.deleted? ? "" : message.body.to_s)
      media = html_media(message)
      "<p><strong>#{name}</strong> #{body}#{media}</p>"
    end

    def html_media(message)
      return "" unless @job.include_media

      message.attachments.filter_map do |attachment|
        next unless attachment.kind == "image" && attachment.file.attached?

        data = media_data(attachment)
        type = ERB::Util.html_escape(attachment.content_type)
        "<img src=\"data:#{type};base64,#{data}\" alt=\"\" />"
      end.join
    end
    # rubocop:enable Rajya/NoUserFacingStrings
  end
end
