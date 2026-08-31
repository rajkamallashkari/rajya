require "json"
require "net/http"
require "uri"

module Ai
  module Providers
    class Groq < OpenAiCompatible
      Transcript = Struct.new(:text, :language, keyword_init: true)

      def transcribe(io:, filename:, content_type:, model:)
        return :missing_key if api_key.blank?

        uri = URI::HTTPS.build(host: host, path: Settings.fetch(:groq_transcribe_path))
        response = post_multipart(uri, io, filename, content_type, model)
        classify_transcript(response)
      rescue Timeout::Error, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, SocketError, EOFError
        :timeout
      end

      def chat(messages:, model:, tools: nil, images: nil)
        return :missing_key if api_key.blank?

        super
      end

      def stream_chat(messages:, model:, tools: nil, images: nil, &on_delta)
        return :missing_key if api_key.blank?

        super
      end

      def capabilities
        %i[chat stream_chat transcribe]
      end

      private

      def api_key
        Settings.fetch(:groq_api_key).to_s
      end

      def host
        Settings.fetch(:groq_host)
      end

      def chat_path
        Settings.fetch(:groq_chat_path)
      end

      def classify_transcript(response)
        code = Http.classify(response)
        return code unless response.is_a?(Net::HTTPSuccess)

        payload = JSON.parse(response.body)
        Transcript.new(text: payload["text"].to_s, language: payload["language"])
      rescue JSON::ParserError
        :upstream_failed
      end

      def post_multipart(uri, io, filename, content_type, model)
        boundary = "----rajya#{SecureRandom.hex(8)}"
        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{api_key}"
        request["Content-Type"] = "multipart/form-data; boundary=#{boundary}"
        request.body = multipart(boundary, io, filename.to_s, content_type.to_s, model.to_s)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.open_timeout = Ai::Limits.stream_timeout
        http.read_timeout = Ai::Limits.stream_timeout
        http.request(request)
      end

      def multipart(boundary, io, filename, content_type, model)
        safe_name = filename.tr('"', "_")
        file_data = io.read
        [
          "--#{boundary}\r\n",
          "Content-Disposition: form-data; name=\"model\"\r\n\r\n",
          "#{model}\r\n",
          "--#{boundary}\r\n",
          "Content-Disposition: form-data; name=\"response_format\"\r\n\r\n",
          "verbose_json\r\n",
          "--#{boundary}\r\n",
          "Content-Disposition: form-data; name=\"file\"; filename=\"#{safe_name}\"\r\n",
          "Content-Type: #{content_type}\r\n\r\n",
          file_data,
          "\r\n--#{boundary}--\r\n"
        ].join
      end
    end
  end
end
