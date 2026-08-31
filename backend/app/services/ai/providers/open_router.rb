module Ai
  module Providers
    class OpenRouter < OpenAiCompatible
      def chat(messages:, model:, tools: nil, images: nil)
        return :missing_key if api_key.blank?

        super
      end

      def stream_chat(messages:, model:, tools: nil, images: nil, &on_delta)
        return :missing_key if api_key.blank?

        super
      end

      private

      def api_key
        Settings.fetch(:openrouter_api_key).to_s
      end

      def host
        Settings.fetch(:openrouter_host)
      end

      def chat_path
        Settings.fetch(:openrouter_chat_path)
      end

      def extra_headers
        {
          "HTTP-Referer" => Settings.fetch(:openrouter_http_referer),
          "X-Title" => Settings.fetch(:openrouter_title)
        }
      end
    end
  end
end
