require "rails_helper"

# rubocop:disable RSpec/AnyInstance, RSpec/ExampleLength, RSpec/MessageChain, RSpec/VerifiedDoubleReference -- vips, variant, and Kernel#system collaborators
RSpec.describe Attachments::Process do
  def attach_blob(content_type:, filename:, io:)
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    attachment = create(:attachment, message: message, content_type: content_type, kind: Attachment.kind_for(content_type))
    blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: content_type)
    attachment.file.attach(blob)
    attachment
  end

  def stub_ffmpeg(probe:, success: true)
    allow(Open3).to receive_messages(
      capture2e: [ "ok", instance_double(Process::Status, success?: true) ],
      capture2: [ probe, instance_double(Process::Status, success?: success) ]
    )
  end

  def stub_vips!
    image_class = Class.new do
      def self.new_from_file(_path); end
    end
    processing_vips = Class.new do
      def self.source(_path); end
    end
    processing = Module.new
    processing.const_set(:Vips, processing_vips)
    stub_const("Vips", Module.new)
    stub_const("Vips::Error", Class.new(StandardError))
    stub_const("Vips::Image", image_class)
    stub_const("ImageProcessing", processing)
    allow_any_instance_of(described_class).to receive(:require).with("vips")
  end

  it "persists the sniffed MIME type over the client's claim (BR-89)" do
    attachment = attach_blob(content_type: "text/plain", filename: "note.txt", io: StringIO.new(png_bytes))

    described_class.call(attachment: attachment)

    expect(attachment.reload.content_type).to eq("image/png")
    expect(attachment.kind).to eq("image")
  end

  it "marks the attachment failed when ffmpeg is missing (F-17, BR-96)" do
    attachment = attach_blob(content_type: "video/mp4", filename: "a.mp4", io: StringIO.new("vid"))
    allow(Storage::Mime).to receive_messages(sniff: "video/mp4", blocked?: false)
    allow(Open3).to receive(:capture2e).and_raise(Errno::ENOENT)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_status).to eq("failed")
    expect(attachment.processing_error).to eq("ffmpeg_missing")
  end

  it "marks a blocked sniffed type as failed" do
    attachment = attach_blob(content_type: "application/x-msdownload", filename: "x.bin", io: StringIO.new("MZ"))
    allow(Storage::Mime).to receive_messages(sniff: "application/x-msdownload", blocked?: true)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_status).to eq("failed")
    expect(attachment.processing_error).to eq("blocked_type")
  end

  it "no-ops when the attachment is missing or has no file" do
    expect(described_class.call(attachment_id: 0).value).to be_nil
    expect(described_class.call(attachment: create(:attachment)).value.processing_status).to eq("pending")
  end

  it "marks probe_failed when ffprobe exits unsuccessfully" do
    attachment = attach_blob(content_type: "audio/mpeg", filename: "a.mp3", io: StringIO.new("mp3"))
    allow(Storage::Mime).to receive_messages(sniff: "audio/mpeg", blocked?: false)
    stub_ffmpeg(probe: "{}", success: false)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("probe_failed")
  end

  it "skips probing a voice note that already has duration and waveform (BR-19)" do
    attachment = attach_blob(content_type: "audio/ogg", filename: "v.ogg", io: StringIO.new("ogg"))
    attachment.update!(kind: "voice", duration_ms: 1_000, waveform: [ 0.1, 0.2 ])

    expect { described_class.call(attachment: attachment) }
      .to have_enqueued_job(Attachments::TranscribeJob).with(attachment.id)

    expect(attachment.reload.processing_status).to eq("ready")
    expect(attachment.transcript_status).to eq("pending")
  end

  it "does not enqueue transcription when the flag is off" do
    create(:feature_flag, key: "voice_transcription",
                          description: FeatureFlagRegistry.description_for(:voice_transcription), enabled: false)
    attachment = attach_blob(content_type: "audio/ogg", filename: "v.ogg", io: StringIO.new("ogg"))
    attachment.update!(kind: "voice", duration_ms: 1_000, waveform: [ 0.1, 0.2 ])

    expect { described_class.call(attachment: attachment) }.not_to have_enqueued_job(Attachments::TranscribeJob)
    expect(attachment.reload.transcript_status).to be_nil
  end

  it "probes audio duration when ffmpeg is present" do
    attachment = attach_blob(content_type: "audio/mpeg", filename: "a.mp3", io: StringIO.new("mp3"))
    allow(Storage::Mime).to receive_messages(sniff: "audio/mpeg", blocked?: false)
    stub_ffmpeg(probe: { format: { duration: "2.5" }, streams: [] }.to_json)

    described_class.call(attachment: attachment)

    expect(attachment.reload.duration_ms).to eq(2_500)
    expect(attachment.processing_status).to eq("ready")
  end

  it "marks probe failure when ffprobe returns invalid JSON" do
    attachment = attach_blob(content_type: "audio/mpeg", filename: "a.mp3", io: StringIO.new("mp3"))
    allow(Storage::Mime).to receive_messages(sniff: "audio/mpeg", blocked?: false)
    stub_ffmpeg(probe: "not-json")

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("probe_failed")
  end

  it "does not raise when fail_record! is given a missing row" do
    expect { described_class.new.fail_record!(nil, "unreadable") }.not_to raise_error
  end

  it "marks an unreadable image as failed" do
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new("nope"))
    allow(Storage::Mime).to receive_messages(sniff: "image/png", blocked?: false)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("unreadable")
  end

  it "processes a PDF thumbnail variant" do
    attachment = attach_blob(
      content_type: "application/pdf", filename: "a.pdf", io: StringIO.new("%PDF-1.4\n")
    )
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: true)
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_status).to eq("ready")
  end

  it "records video dimensions from ffprobe and skips a missing thumbnail file" do
    attachment = attach_blob(content_type: "video/mp4", filename: "a.mp4", io: StringIO.new("vid"))
    allow(Storage::Mime).to receive_messages(sniff: "video/mp4", blocked?: false)
    stub_ffmpeg(probe: { format: { duration: "1.5" }, streams: [ { codec_type: "video", width: 2, height: 2 } ] }.to_json)
    allow_any_instance_of(described_class).to receive(:system).and_return(false)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(width: 2, height: 2, duration_ms: 1_500, processing_status: "ready")
  end

  it "records image dimensions, variants, and a blurhash" do
    stub_vips!
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new(png_bytes))
    rgb = instance_double("Vips::Image", width: 8, height: 8, bands: 3)
    rgba = instance_double("Vips::Image", width: 8, height: 8, write_to_memory: "\x00" * 256)
    thumb = Tempfile.new([ "thumb", ".png" ])
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: true)
    allow(rgb).to receive_messages(cast: rgb, add_alpha: rgba)
    allow(Vips::Image).to receive(:new_from_file).and_return(rgb)
    allow(ImageProcessing::Vips).to receive_message_chain(:source, :resize_to_fit, :convert, :call).and_return(thumb)
    allow(Blurhash).to receive(:encode).and_return("Lhash")
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(width: 8, height: 8, blurhash: "Lhash", processing_status: "ready")
    expect(rgb).to have_received(:add_alpha)
  ensure
    thumb&.close
    thumb&.unlink
  end

  it "leaves blurhash unset when thumbnail encoding raises" do
    stub_vips!
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new(png_bytes))
    image = instance_double("Vips::Image", width: 1, height: 1)
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: true)
    allow(Vips::Image).to receive(:new_from_file).and_return(image)
    allow(ImageProcessing::Vips).to receive(:source).and_raise(StandardError, "nope")
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(blurhash: nil, processing_status: "ready")
  end

  it "skips blurhash when the encoder constant is missing" do
    stub_vips!
    hide_const("Blurhash")
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new(png_bytes))
    image = instance_double("Vips::Image", width: 1, height: 1)
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: true)
    allow(Vips::Image).to receive(:new_from_file).and_return(image)
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    described_class.call(attachment: attachment)

    expect(attachment.reload.blurhash).to be_nil
  end

  it "encodes blurhash without adding alpha when the thumbnail already has it" do
    stub_vips!
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new(png_bytes))
    rgba = instance_double("Vips::Image", width: 8, height: 8, bands: 4, write_to_memory: "\x00" * 256)
    thumb = Tempfile.new([ "thumb", ".png" ])
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: true)
    allow(rgba).to receive_messages(cast: rgba, add_alpha: rgba)
    allow(Vips::Image).to receive(:new_from_file).and_return(rgba)
    allow(ImageProcessing::Vips).to receive_message_chain(:source, :resize_to_fit, :convert, :call).and_return(thumb)
    allow(Blurhash).to receive(:encode).and_return("Lrgba")
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    described_class.call(attachment: attachment)

    expect(attachment.reload.blurhash).to eq("Lrgba")
    expect(rgba).not_to have_received(:add_alpha)
  ensure
    thumb&.close
    thumb&.unlink
  end

  it "marks an image failed when libvips cannot be loaded" do
    attachment = attach_blob(content_type: "image/png", filename: "a.png", io: StringIO.new(png_bytes))
    allow(Storage::Mime).to receive_messages(sniff: "image/png", blocked?: false)
    allow_any_instance_of(described_class).to receive(:require).with("vips").and_raise(LoadError)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("unreadable")
  end

  it "marks ffmpeg_missing when ffmpeg exits unsuccessfully" do
    attachment = attach_blob(content_type: "video/mp4", filename: "a.mp4", io: StringIO.new("vid"))
    allow(Storage::Mime).to receive_messages(sniff: "video/mp4", blocked?: false)
    allow(Open3).to receive(:capture2e).and_return(
      [ "ok", instance_double(Process::Status, success?: true) ],
      [ "missing", instance_double(Process::Status, success?: false) ]
    )

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("ffmpeg_missing")
  end

  it "skips probing audio that already has a duration" do
    attachment = attach_blob(content_type: "audio/mpeg", filename: "a.mp3", io: StringIO.new("mp3"))
    attachment.update!(duration_ms: 900)
    allow(Storage::Mime).to receive_messages(sniff: "audio/mpeg", blocked?: false)
    allow(Open3).to receive(:capture2e)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(duration_ms: 900, processing_status: "ready")
    expect(Open3).not_to have_received(:capture2e)
  end

  it "probes a voice note that is missing duration" do
    attachment = attach_blob(content_type: "audio/ogg", filename: "v.ogg", io: StringIO.new("ogg"))
    attachment.update!(kind: "voice")
    allow(Storage::Mime).to receive_messages(sniff: "audio/ogg", blocked?: false)
    stub_ffmpeg(probe: { format: { duration: "1.25" }, streams: [] }.to_json)

    described_class.call(attachment: attachment)

    expect(attachment.reload.duration_ms).to eq(1_250)
  end

  it "attaches a video thumbnail when ffmpeg writes a frame" do
    attachment = attach_blob(content_type: "video/mp4", filename: "a.mp4", io: StringIO.new("vid"))
    allow(Storage::Mime).to receive_messages(sniff: "video/mp4", blocked?: false)
    stub_ffmpeg(probe: { format: {}, streams: [ { codec_type: "video", width: 4, height: 4 } ] }.to_json)
    allow(SecureRandom).to receive(:uuid).and_return("fixed")
    out_path = File.join(Dir.tmpdir, "thumb_fixed.webp")
    allow_any_instance_of(described_class).to receive(:system) do
      File.write(out_path, "webp")
      true
    end

    described_class.call(attachment: attachment)

    expect(attachment.reload.thumbnail).to be_attached
    expect(attachment.duration_ms).to be_nil
    expect(File).not_to exist(out_path)
  end

  it "marks an unreadable PDF as failed" do
    attachment = attach_blob(
      content_type: "application/pdf", filename: "a.pdf", io: StringIO.new("%PDF-1.4\n")
    )
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_raise(StandardError, "nope")

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_error).to eq("unreadable")
  end

  it "marks a non-PDF file ready without generating a thumbnail" do
    attachment = attach_blob(content_type: "application/zip", filename: "a.zip", io: StringIO.new("PK"))
    allow(Storage::Mime).to receive_messages(sniff: "application/zip", blocked?: false)

    described_class.call(attachment: attachment)

    expect(attachment.reload.processing_status).to eq("ready")
    expect(attachment.thumbnail).not_to be_attached
  end

  it "does not publish when the attachment is no longer tied to a message" do
    attachment = create(:attachment)
    allow(attachment).to receive(:message).and_return(nil)
    allow(Realtime).to receive(:publish)

    described_class.new.fail_record!(attachment, "unreadable")

    expect(Realtime).not_to have_received(:publish)
    expect(attachment.reload.processing_status).to eq("failed")
  end

  it "no-ops processing for an unrecognized kind" do
    attachment = attach_blob(content_type: "text/plain", filename: "a.txt", io: StringIO.new("hi"))
    allow(attachment).to receive(:kind).and_return("sticker")

    described_class.new.send(:process_kind!, attachment)

    expect(attachment.reload.processing_status).to eq("pending")
  end

  it "records nil video dimensions when ffprobe has no video stream" do
    attachment = attach_blob(content_type: "video/mp4", filename: "a.mp4", io: StringIO.new("vid"))
    allow(Storage::Mime).to receive_messages(sniff: "video/mp4", blocked?: false)
    stub_ffmpeg(probe: { format: { duration: "1" }, streams: [ { codec_type: "audio" } ] }.to_json)
    allow_any_instance_of(described_class).to receive(:system).and_return(false)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(width: nil, height: nil, duration_ms: 1_000)
  end

  it "leaves audio duration unset when ffprobe omits format duration" do
    attachment = attach_blob(content_type: "audio/mpeg", filename: "a.mp3", io: StringIO.new("mp3"))
    allow(Storage::Mime).to receive_messages(sniff: "audio/mpeg", blocked?: false)
    stub_ffmpeg(probe: { format: {}, streams: [] }.to_json)

    described_class.call(attachment: attachment)

    expect(attachment.reload.duration_ms).to be_nil
    expect(attachment.processing_status).to eq("ready")
  end
end
# rubocop:enable RSpec/AnyInstance, RSpec/ExampleLength, RSpec/MessageChain, RSpec/VerifiedDoubleReference
