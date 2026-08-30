require "rails_helper"

RSpec.describe Storage::Mime do
  it "classifies content types onto file-cap categories (BR-88)" do
    expect(described_class.cap_category("image/png")).to eq("image")
    expect(described_class.cap_category("video/mp4")).to eq("video")
    expect(described_class.cap_category("audio/ogg")).to eq("audio")
    expect(described_class.cap_category("application/pdf")).to eq("other")
  end

  it "rejects blocked extensions and MIME prefixes (BR-89)" do
    expect(described_class.blocked?("evil.exe", "application/octet-stream")).to be(true)
    expect(described_class.blocked?("pic.png", "application/x-msdownload")).to be(true)
    expect(described_class.blocked?("pic.png", "image/png")).to be(false)
  end

  it "caps non-AV types with the other limit (BR-88)" do
    expect(described_class.byte_cap_for("image/png")).to eq(Settings.fetch(:file_caps).fetch("image"))
    expect(described_class.byte_cap_for("application/zip")).to eq(Settings.fetch(:file_caps).fetch("other"))
  end

  it "sniffs magic bytes instead of the client-declared type (BR-89)" do
    blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(png_bytes), filename: "note.txt", content_type: "text/plain"
    )

    expect(described_class.sniff(blob)).to eq("image/png")
  end

  it "falls back to the other cap when a category is missing from file_caps" do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:file_caps).and_return({ "image" => 10, "other" => 7 })

    expect(described_class.byte_cap_for("video/mp4")).to eq(7)
  end
end
