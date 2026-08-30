require "json"
require "net/http"
require "uri"

module Ai
  module Providers
    class Groq
      Transcript = Struct.new(:text, :language, keyword_init: true)

      def transcribe(io:, filename:, content_type:, model:)
        key = Settings.fetch(:groq_api_key).to_s
        return :missing_key if key.blank?

        uri = URI::HTTPS.build(host: Settings.fetch(:groq_host), path: Settings.fetch(:groq_transcribe_path))
        response = post(uri, key, io, filename, content_type, model)
        classify(response)
      rescue Timeout::Error, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, SocketError, EOFError
        :upstream_failed
      end

      private

      def classify(response)
        return :quota_exhausted if quota_response?(response)
        return :upstream_failed unless response.is_a?(Net::HTTPSuccess)

        payload = JSON.parse(response.body)
        Transcript.new(text: payload["text"].to_s, language: payload["language"])
      rescue JSON::ParserError
        :upstream_failed
      end

      def quota_response?(response)
        response.is_a?(Net::HTTPTooManyRequests) || response.is_a?(Net::HTTPPaymentRequired)
      end

      def post(uri, key, io, filename, content_type, model)
        boundary = "----rajya#{SecureRandom.hex(8)}"
        request = Net::HTTP::Post.new(uri)
        request["Authorization"] = "Bearer #{key}"
        request["Content-Type"] = "multipart/form-data; boundary=#{boundary}"
        request.body = multipart(boundary, io, filename.to_s, content_type.to_s, model.to_s)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
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
