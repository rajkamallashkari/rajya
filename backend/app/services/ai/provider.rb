# One interface for every inference backend (TARGET §6.2). tools:/images:,
# embed, and generate_image are seams for NR-F2–F4 — unused at launch.
module Ai
  class Provider
    ChatResult = Struct.new(:text, :prompt_tokens, :completion_tokens, keyword_init: true)
    EmbedResult = Struct.new(:vectors, keyword_init: true)
    ImageResult = Struct.new(:bytes, :content_type, keyword_init: true)

    def stream_chat(messages:, model:, tools: nil, images: nil, &on_delta)
      result = chat(messages: messages, model: model, tools: tools, images: images)
      on_delta&.call(result.text) if result.is_a?(ChatResult) && result.text.present?
      result
    end

    def chat(messages:, model:, tools: nil, images: nil)
      :unsupported
    end

    def embed(texts:, model:)
      :unsupported
    end

    def generate_image(prompt:, model:)
      :unsupported
    end

    def transcribe(io:, filename:, content_type:, model:)
      :unsupported
    end

    def capabilities
      []
    end
  end
end
