require "rails_helper"

# rubocop:disable RSpec/AnyInstance -- ActiveStorage blob variant collaborator
RSpec.describe Attachments::IssueUrl do
  around do |example|
    ActiveStorage::Current.url_options = { host: "www.example.com" }
    example.run
  ensure
    ActiveStorage::Current.reset
  end

  it "issues a short-lived URL for an attached file (BR-93)" do
    attachment = create(:attachment)
    attachment.file.attach(
      io: StringIO.new("img"), filename: "pic.png", content_type: "image/png"
    )

    result = described_class.call(attachment: attachment)

    expect(result).to be_success
    expect(result.value.url).to be_present
    expect(result.value.expires_at).to be_within(2.seconds).of(Settings.fetch(:signed_url_ttl).seconds.from_now)
  end

  it "keeps a stalled attachment original available after reloading persisted state" do
    attachment = create(:attachment, processing_status: "pending")
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
    attachment.update_columns(updated_at: (Settings.fetch(:media_process_stale_after) + 1).seconds.ago)

    persisted_attachment = described_class.call(attachment: Attachment.find(attachment.id))

    expect(persisted_attachment).to be_success
    expect(persisted_attachment.value.url).to be_present
    expect(attachment.reload.processing_status).to eq("pending")
  end

  it "returns not_found when media is disabled or the file is missing" do
    create(:feature_flag, key: "media_attachments",
                          description: FeatureFlagRegistry.description_for(:media_attachments), enabled: false)
    attachment = create(:attachment)
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")

    expect(described_class.call(attachment: attachment).error_code).to eq(:not_found)
  end

  it "returns not_found when the attachment has no file" do
    expect(described_class.call(attachment: create(:attachment)).error_code).to eq(:not_found)
  end

  it "does not expose a video blob as an image thumbnail" do
    attachment = create(:attachment, kind: "video", content_type: "video/mp4")
    attachment.file.attach(io: StringIO.new("vid"), filename: "a.mp4", content_type: "video/mp4")

    result = described_class.call(attachment: attachment, variant: :thumb)

    expect(result.error_code).to eq(:not_found)
  end

  it "uses an attached thumbnail blob when present" do
    attachment = create(:attachment, kind: "video", content_type: "video/mp4")
    attachment.file.attach(io: StringIO.new("vid"), filename: "a.mp4", content_type: "video/mp4")
    attachment.thumbnail.attach(io: StringIO.new("thumb"), filename: "t.webp", content_type: "image/webp")

    result = described_class.call(attachment: attachment, variant: :thumb)

    expect(result.value.url).to be_present
  end

  it "issues a processed image thumb variant" do
    attachment = create(:attachment, kind: "image", content_type: "image/png")
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
    processed = instance_double(ActiveStorage::VariantWithRecord, url: "https://r2.example/thumb")
    variant = instance_double(ActiveStorage::VariantWithRecord, processed: processed)
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_return(variant)

    result = described_class.call(attachment: attachment, variant: :thumb)

    expect(result.value.url).to eq("https://r2.example/thumb")
  end

  it "falls back to the original blob when variant processing raises" do
    attachment = create(:attachment, kind: "image", content_type: "image/png")
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
    allow_any_instance_of(ActiveStorage::Blob).to receive(:variant).and_raise(StandardError, "nope")

    result = described_class.call(attachment: attachment, variant: :thumb)

    expect(result.value.url).to include("rails/active_storage")
  end
end
# rubocop:enable RSpec/AnyInstance
