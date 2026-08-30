require "json"
require "net/http"
require "uri"

module Gifs
  class Tenor
    Result = Struct.new(:id, :title, :preview_url, :gif_url, keyword_init: true)

    def search(query)
      key = Settings.fetch(:tenor_api_key).to_s
      return :missing_key if key.blank?

      uri = api_uri("/v2/search", q: query.to_s, limit: Settings.fetch(:gif_search_limit),
                                  client_key: Settings.fetch(:tenor_client_key), key: key,
                                  media_filter: "gif,tinygif")
      payload = get_json(uri)
      return :upstream_failed if payload.nil?

      Array(payload["results"]).filter_map { |row| result_from(row) }
    end

    def fetch(id)
      key = Settings.fetch(:tenor_api_key).to_s
      return :missing_key if key.blank?

      uri = api_uri("/v2/posts", ids: id.to_s, key: key, media_filter: "gif")
      payload = get_json(uri)
      return :upstream_failed if payload.nil?

      row = Array(payload["results"]).first
      result_from(row)
    end

    def download(url)
      uri = URI.parse(url.to_s)
      return if uri.host.blank?

      response = get(uri)
      return unless response.is_a?(Net::HTTPSuccess)

      response.body
    rescue URI::InvalidURIError
      nil
    end

    private

    def result_from(row)
      return if row.blank?

      formats = row["media_formats"] || {}
      gif = formats["gif"] || {}
      tiny = formats["tinygif"] || gif
      url = gif["url"].to_s
      return if url.blank?

      Result.new(
        id: row["id"].to_s,
        title: row["title"].to_s,
        preview_url: tiny["url"].to_s.presence || url,
        gif_url: url
      )
    end

    def api_uri(path, params)
      uri = URI::HTTPS.build(host: Settings.fetch(:tenor_host), path: path)
      uri.query = URI.encode_www_form(params)
      uri
    end

    def get_json(uri)
      response = get(uri)
      return unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue JSON::ParserError
      nil
    end

    def get(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.request(Net::HTTP::Get.new(uri))
    end
  end
end
