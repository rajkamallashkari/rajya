require "json"
require "net/http"
require "openssl"
require "uri"

module Calls
  # STUN always; self-hosted coturn HMAC first; Metered TURN only when coturn
  # is unset (MASTER_PLAN P11 / BR-71). Failures fall back to STUN-only.
  class IceServers
    METERED_CACHE_KEY = "rajya/ice/metered"

    def initialize(http: Http.new)
      @http = http
    end

    def credentials_for(account)
      servers = Array(Settings.fetch(:stun_urls)).map { |url| { "urls" => url } }
      turn = coturn_credentials(account) || metered_credentials
      case turn
      when Hash then servers << turn
      when Array then servers.concat(turn)
      end
      servers
    end

    private

    def coturn_credentials(account)
      secret = ENV["TURN_SECRET"].to_s.presence
      host = ENV["TURN_HOST"].to_s.presence
      return if secret.blank? || host.blank?

      expiry = Settings.fetch(:turn_credential_ttl).seconds.from_now.to_i
      username = "#{expiry}:#{account.id}"
      credential = Base64.strict_encode64(OpenSSL::HMAC.digest("SHA1", secret, username))
      port = Settings.fetch(:turn_port)
      {
        "urls" => [
          "turn:#{host}:#{port}?transport=tcp",
          "turns:#{host}:#{port}?transport=tcp"
        ],
        "username" => username,
        "credential" => credential
      }
    end

    def metered_credentials
      api_key = ENV["METERED_API_KEY"].to_s.presence
      domain = ENV["METERED_APP_DOMAIN"].to_s.presence
      return if api_key.blank? || domain.blank?

      cached = Rails.cache.read(METERED_CACHE_KEY)
      return cached if cached

      servers = fetch_metered(domain, api_key)
      Rails.cache.write(METERED_CACHE_KEY, servers, expires_in: Settings.fetch(:metered_ice_cache_ttl).seconds) if servers
      servers
    end

    def fetch_metered(domain, api_key)
      uri = URI::HTTPS.build(host: domain, path: "/api/v1/turn/credentials")
      uri.query = URI.encode_www_form(apiKey: api_key)
      payload = @http.get_json(uri, timeout: Settings.fetch(:metered_ice_timeout))
      payload if payload.is_a?(Array)
    end

    class Http
      def get_json(uri, timeout:)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.open_timeout = timeout
        http.read_timeout = timeout
        response = http.request(Net::HTTP::Get.new(uri))
        return unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body)
      rescue StandardError
        nil
      end
    end
  end
end
