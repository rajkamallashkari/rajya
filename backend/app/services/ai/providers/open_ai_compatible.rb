require "json"

module Ai
  module Providers
    # Shared OpenAI chat-completions client used by Groq and OpenRouter.
    class OpenAiCompatible < Provider
      def chat(messages:, model:, tools: nil, images: nil)
        payload, error = Http.post_json(
          chat_uri, headers: headers, body: json_body(messages, model, tools, images, stream: false),
          timeout: Ai::Limits.stream_timeout
        )
        return error if error

        chat_result(payload)
      end

      def stream_chat(messages:, model:, tools: nil, images: nil, &on_delta)
        text = +""
        error = Http.post_stream(
          chat_uri, headers: headers, body: json_body(messages, model, tools, images, stream: true),
          timeout: Ai::Limits.stream_timeout
        ) do |chunk|
          drain_sse(chunk) do |delta|
            text << delta
            on_delta&.call(delta)
          end
        end
        return error if error

        ChatResult.new(text: text)
      end

      def capabilities
        %i[chat stream_chat]
      end

      private

      def chat_uri
        URI::HTTPS.build(host: host, path: chat_path)
      end

      def headers
        extra_headers.merge(
          "Authorization" => "Bearer #{api_key}",
          "Content-Type" => "application/json"
        )
      end

      def extra_headers
        {}
      end

      def json_body(messages, model, tools, images, stream:)
        payload = {
          "model" => model,
          "messages" => with_images(messages, images),
          "max_tokens" => Ai::Limits.max_tokens,
          "temperature" => Ai::Limits.temperature
        }
        payload["stream"] = true if stream
        payload["tools"] = tools if tools.present?
        payload.to_json
      end

      def with_images(messages, images)
        return messages if images.blank?

        rows = messages.map(&:dup)
        last = rows.last
        return rows if last.nil?

        parts = [ { "type" => "text", "text" => last[:content] || last["content"] } ]
        Array(images).each { |url| parts << { "type" => "image_url", "image_url" => { "url" => url } } }
        last = last.merge(content: parts)
        rows[-1] = last
        rows
      end

      def chat_result(payload)
        ChatResult.new(
          text: payload.dig("choices", 0, "message", "content").to_s,
          prompt_tokens: payload.dig("usage", "prompt_tokens"),
          completion_tokens: payload.dig("usage", "completion_tokens")
        )
      end

      def drain_sse(chunk, &on_delta)
        @sse_buffer ||= +""
        @sse_buffer << chunk.to_s
        while (idx = @sse_buffer.index("\n"))
          line = @sse_buffer[0, idx].strip
          @sse_buffer = @sse_buffer[(idx + 1)..]
          delta = sse_delta(line)
          on_delta.call(delta) if delta.present?
        end
      end

      def sse_delta(line)
        return if line.blank? || !line.start_with?("data: ")

        payload = line.delete_prefix("data: ")
        return if payload == "[DONE]"

        JSON.parse(payload).dig("choices", 0, "delta", "content")
      rescue JSON::ParserError
        nil
      end

      def api_key
        raise NotImplementedError
      end

      def host
        raise NotImplementedError
      end

      def chat_path
        raise NotImplementedError
      end
    end
  end
end
