require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- provider chain, usage events, and cancel
RSpec.describe Ai::Runner do
  def voice_io
    StringIO.new("ogg")
  end

  def use_chain(*entries)
    allow(Ai::ModelRegistry).to receive(:chain_for).and_return(entries)
  end

  it "returns a successful transcript and writes a usage event" do
    account = create(:account)
    conversation = create(:conversation)
    hit = Ai::Providers::Groq::Transcript.new(text: "hi", language: "en")
    groq = instance_double(Ai::Providers::Groq, transcribe: hit)
    use_chain(Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-large-v3"))
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)

    result = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: account, conversation: conversation
    )

    expect(result.status).to eq("success")
    expect(result.transcript.text).to eq("hi")
    expect(AiUsageEvent.last).to have_attributes(capability: "transcribe", status: "success", account: account)
  end

  it "falls through the chain on 429 and records a fallback usage event (BR-73)" do
    first = Ai::ModelRegistry::Entry.new(provider: "groq", model: "llama-a")
    second = Ai::ModelRegistry::Entry.new(provider: "ollama", model: "llama-b")
    groq = instance_double(Ai::Providers::Groq, chat: :quota_exhausted)
    ollama = instance_double(Ai::Providers::Ollama, chat: Ai::Provider::ChatResult.new(text: "ok", prompt_tokens: 2, completion_tokens: 3))
    use_chain(first, second)
    allow(Ai::ModelRegistry).to receive(:provider_for).with("groq").and_return(groq)
    allow(Ai::ModelRegistry).to receive(:provider_for).with("ollama").and_return(ollama)

    result = described_class.chat(
      messages: [ { role: "user", content: "hi" } ], capability: :bot_reply, account: create(:account)
    )

    expect(result).to have_attributes(status: "success", text: "ok", prompt_tokens: 2)
    expect(AiUsageEvent.pluck(:status)).to eq(%w[fallback success])
  end

  it "tries the next transcribe model after a skippable failure" do
    first = Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-large-v3")
    second = Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-fallback")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:transcribe).and_return(:quota_exhausted, Ai::Providers::Groq::Transcript.new(text: "ok", language: "en"))
    use_chain(first, second)
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)

    result = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: create(:account), conversation: create(:conversation)
    )

    expect(result.status).to eq("success")
    expect(AiUsageEvent.pluck(:status)).to eq(%w[fallback success])
  end

  it "returns failed when every provider misses and when the chain is empty" do
    use_chain(Ai::ModelRegistry::Entry.new(provider: "missing", model: "x"))
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(nil)

    missed = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: nil, conversation: nil
    )
    expect(missed).to have_attributes(status: "failed", error_code: "unsupported")

    use_chain
    empty = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: nil, conversation: nil
    )
    expect(empty.provider).to eq("none")
  end

  it "stops the chain on a non-skippable error and skips rewind when IO cannot" do
    first = Ai::ModelRegistry::Entry.new(provider: "groq", model: "a")
    second = Ai::ModelRegistry::Entry.new(provider: "groq", model: "b")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:transcribe).and_return(:upstream_failed)
    use_chain(first, second)
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)
    io = Class.new do
      def read(*) = "ogg"
    end.new

    result = described_class.transcribe(
      io: io, filename: "a.ogg", content_type: "audio/ogg",
      account: create(:account), conversation: create(:conversation)
    )

    expect(result.error_code).to eq("upstream_failed")
    expect(groq).to have_received(:transcribe).once
  end

  it "cancels before the first delta and persists nothing" do
    entry = Ai::ModelRegistry::Entry.new(provider: "groq", model: "llama")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:stream_chat) do |&block|
      block.call("Hel")
      Ai::Provider::ChatResult.new(text: "Hel")
    end
    use_chain(entry)
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)
    Ai::Cancellation.request!("g0")

    result = described_class.stream_chat(
      messages: [ { role: "user", content: "hi" } ], capability: :bot_reply,
      account: create(:account), generation_id: "g0"
    )

    expect(result).to have_attributes(status: "success", cancelled: true, text: "")
  end

  it "cancels mid-stream and keeps the accumulated text" do
    entry = Ai::ModelRegistry::Entry.new(provider: "groq", model: "llama")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:stream_chat) do |&block|
      block.call("Hel")
      Ai::Cancellation.request!("g1")
      block.call("lo")
      Ai::Provider::ChatResult.new(text: "Hello")
    end
    use_chain(entry)
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)
    deltas = []

    result = described_class.stream_chat(
      messages: [ { role: "user", content: "hi" } ], capability: :bot_reply,
      account: create(:account), generation_id: "g1"
    ) { |delta| deltas << delta }

    expect(result).to have_attributes(status: "success", cancelled: true, text: "Hel")
    expect(deltas).to eq([ "Hel" ])
  end

  it "yields streamed tokens when the generation is not cancelled" do
    entry = Ai::ModelRegistry::Entry.new(provider: "groq", model: "llama")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:stream_chat) do |&block|
      block.call("Hi")
      Ai::Provider::ChatResult.new(text: "Hi")
    end
    use_chain(entry)
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)
    deltas = []

    result = described_class.stream_chat(
      messages: [ { role: "user", content: "hi" } ], capability: :rewrite,
      account: create(:account)
    ) { |delta| deltas << delta }

    expect(result).to have_attributes(status: "success", text: "Hi")
    expect(deltas).to eq([ "Hi" ])
    expect(described_class.stream_chat(
      messages: [ { role: "user", content: "hi" } ], capability: :rewrite, account: create(:account)
    ).text).to eq("Hi")
  end

  it "embeds texts and returns generated image bytes" do
    account = create(:account)
    embed_entry = Ai::ModelRegistry::Entry.new(provider: "ollama", model: "nomic")
    image_entry = Ai::ModelRegistry::Entry.new(provider: "groq", model: "img")
    ollama = instance_double(Ai::Providers::Ollama, embed: Ai::Provider::EmbedResult.new(vectors: [ [ 0.1 ] ]))
    groq = instance_double(Ai::Providers::Groq, generate_image: Ai::Provider::ImageResult.new(bytes: "x", content_type: "image/png"))
    allow(Ai::ModelRegistry).to receive(:chain_for).with(:embedding).and_return([ embed_entry ])
    allow(Ai::ModelRegistry).to receive(:chain_for).with(:image_gen).and_return([ image_entry ])
    allow(Ai::ModelRegistry).to receive(:provider_for).with("ollama").and_return(ollama)
    allow(Ai::ModelRegistry).to receive(:provider_for).with("groq").and_return(groq)

    expect(described_class.embed(texts: [ "a" ], account: account).vectors).to eq([ [ 0.1 ] ])
    expect(described_class.generate_image(prompt: "cat", account: account).image.bytes).to eq("x")
  end

  it "rate-limits bot replies before calling a provider (F-12)" do
    account = create(:account)
    stub_setting(:ai_reply_rate_limit, 1, category: "ai")
    groq = instance_double(Ai::Providers::Groq, chat: Ai::Provider::ChatResult.new(text: "a"))
    use_chain(Ai::ModelRegistry::Entry.new(provider: "groq", model: "x"))
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)

    described_class.chat(messages: [], capability: :bot_reply, account: account)
    limited = described_class.chat(messages: [], capability: :bot_reply, account: account)

    expect(limited.error_code).to eq("rate_limited")
    expect(groq).to have_received(:chat).once
  end
end
# rubocop:enable RSpec/ExampleLength
