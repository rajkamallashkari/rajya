require "json"
require "net/http"
require "uri"

module Ai
  module Providers
    class Http
      SKIPPABLE = {
        "401" => :missing_key,
        "402" => :payment_required,
        "404" => :model_unavailable,
        "429" => :quota_exhausted
      }.freeze
      TRANSPORT = [
        Timeout::Error, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, SocketError, EOFError,
        Net::OpenTimeout, Net::ReadTimeout
      ].freeze

      class << self
        def post_json(uri, headers:, body:, timeout:)
          response = request(uri, headers, body, timeout)
          return [ nil, classify(response) ] unless response.is_a?(Net::HTTPSuccess)

          [ JSON.parse(response.body), nil ]
        rescue JSON::ParserError
          [ nil, :upstream_failed ]
        rescue *TRANSPORT
          [ nil, :timeout ]
        end

        def post_stream(uri, headers:, body:, timeout:, &on_chunk)
          code = nil
          session(uri, timeout).request(build(uri, headers, body)) do |response|
            code = classify(response)
            return code unless response.is_a?(Net::HTTPSuccess)

            response.read_body { |chunk| on_chunk.call(chunk) }
          end
          nil
        rescue *TRANSPORT
          :timeout
        end

        def classify(response)
          SKIPPABLE.fetch(response.code.to_s, :upstream_failed)
        end

        private

        def request(uri, headers, body, timeout)
          session(uri, timeout).request(build(uri, headers, body))
        end

        def build(uri, headers, body)
          req = Net::HTTP::Post.new(uri)
          headers.each { |key, value| req[key] = value }
          req.body = body
          req
        end

        def session(uri, timeout)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"
          http.open_timeout = timeout
          http.read_timeout = timeout
          http
        end
      end
    end
  end
end
