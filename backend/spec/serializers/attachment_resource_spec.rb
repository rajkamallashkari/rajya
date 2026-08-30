require "rails_helper"

RSpec.describe AttachmentResource do
  it "serializes processing failure copy from the catalog" do
    attachment = create(:attachment, processing_status: "failed", processing_error: "ffmpeg_missing")
    json = described_class.new(attachment).to_h

    expect(json).to include(
      "id" => attachment.id,
      "processing_status" => "failed",
      "processing_error" => Catalog.t("media.processing.ffmpeg_missing")
    )
  end

  it "omits processing_error and filename when they are blank" do
    json = described_class.new(create(:attachment)).to_h

    expect(json.fetch("processing_error")).to be_nil
    expect(json.fetch("filename")).to be_nil
  end

  it "exposes the attached filename" do
    attachment = create(:attachment)
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")

    expect(described_class.new(attachment).to_h.fetch("filename")).to eq("pic.png")
  end
end
