require "json"
require "uri"

module Ai
  module Providers
    class Gemini < Provider
      def chat(messages:, model:, tools: nil, images: nil)
        return :missing_key if api_key.blank?

        payload, error = Http.post_json(
          generate_uri(model), headers: { "Content-Type" => "application/json" },
          body: body(messages, tools, images), timeout: Ai::Limits.stream_timeout
        )
        return error if error

        ChatResult.new(
          text: payload.dig("candidates", 0, "content", "parts", 0, "text").to_s,
          prompt_tokens: payload.dig("usageMetadata", "promptTokenCount"),
          completion_tokens: payload.dig("usageMetadata", "candidatesTokenCount")
        )
      end

      def capabilities
        %i[chat stream_chat]
      end

      private

      def api_key
        Settings.fetch(:gemini_api_key).to_s
      end

      def generate_uri(model)
        path = format(Settings.fetch(:gemini_generate_path), model: model)
        uri = URI::HTTPS.build(host: Settings.fetch(:gemini_host), path: path)
        uri.query = URI.encode_www_form(key: api_key)
        uri
      end

      def body(messages, tools, images)
        system, rest = split_system(messages)
        payload = { "contents" => contents(rest, images) }
        payload["systemInstruction"] = { "parts" => [ { "text" => system } ] } if system.present?
        payload["tools"] = tools if tools.present?
        payload.to_json
      end

      def split_system(messages)
        system = messages.filter_map { |row| row[:content] || row["content"] if role_of(row) == "system" }.join("\n")
        rest = messages.reject { |row| role_of(row) == "system" }
        [ system, rest ]
      end

      def contents(messages, images)
        messages.map.with_index do |row, index|
          parts = [ { "text" => (row[:content] || row["content"]).to_s } ]
          Array(images).each { |url| parts << { "fileData" => { "fileUri" => url } } } if index == messages.size - 1
          { "role" => (role_of(row) == "assistant" ? "model" : "user"), "parts" => parts }
        end
      end

      def role_of(row)
        (row[:role] || row["role"]).to_s
      end
    end
  end
end
