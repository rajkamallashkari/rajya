require "json"
require "uri"

module Ai
  module Providers
    class Ollama < Provider
      def chat(messages:, model:, tools: nil, images: nil)
        payload, error = Http.post_json(
          uri(Settings.fetch(:ollama_chat_path)), headers: { "Content-Type" => "application/json" },
          body: chat_body(messages, model, tools, images, stream: false), timeout: Ai::Limits.stream_timeout
        )
        return error if error

        ChatResult.new(
          text: payload.dig("message", "content").to_s,
          prompt_tokens: payload["prompt_eval_count"],
          completion_tokens: payload["eval_count"]
        )
      end

      def stream_chat(messages:, model:, tools: nil, images: nil, &on_delta)
        text = +""
        error = Http.post_stream(
          uri(Settings.fetch(:ollama_chat_path)), headers: { "Content-Type" => "application/json" },
          body: chat_body(messages, model, tools, images, stream: true), timeout: Ai::Limits.stream_timeout
        ) do |chunk|
          drain_ndjson(chunk) do |delta|
            text << delta
            on_delta&.call(delta)
          end
        end
        return error if error

        ChatResult.new(text: text)
      end

      def embed(texts:, model:)
        payload, error = Http.post_json(
          uri(Settings.fetch(:ollama_embed_path)), headers: { "Content-Type" => "application/json" },
          body: { "model" => model, "input" => Array(texts) }.to_json, timeout: Ai::Limits.stream_timeout
        )
        return error if error

        vectors = payload["embeddings"].presence
        vectors ||= [ payload["embedding"] ] if payload["embedding"].present?
        return :upstream_failed if vectors.blank?

        EmbedResult.new(vectors: Array(vectors))
      end

      def capabilities
        %i[chat stream_chat embed]
      end

      private

      def uri(path)
        base = URI.parse(Settings.fetch(:ollama_base_url))
        base.path = path
        base
      end

      def chat_body(messages, model, tools, images, stream:)
        payload = {
          "model" => model,
          "messages" => with_images(messages, images),
          "stream" => stream,
          "options" => { "num_predict" => Ai::Limits.max_tokens, "temperature" => Ai::Limits.temperature }
        }
        payload["tools"] = tools if tools.present?
        payload.to_json
      end

      def with_images(messages, images)
        return messages if images.blank?

        rows = messages.map(&:dup)
        last = rows.last
        return rows if last.nil?

        last = last.merge(images: Array(images))
        rows[-1] = last
        rows
      end

      def drain_ndjson(chunk, &on_delta)
        @ndjson_buffer ||= +""
        @ndjson_buffer << chunk.to_s
        while (idx = @ndjson_buffer.index("\n"))
          line = @ndjson_buffer[0, idx].strip
          @ndjson_buffer = @ndjson_buffer[(idx + 1)..]
          delta = ndjson_delta(line)
          on_delta.call(delta) if delta.present?
        end
      end

      def ndjson_delta(line)
        return if line.blank?

        JSON.parse(line).dig("message", "content")
      rescue JSON::ParserError
        nil
      end
    end
  end
end
