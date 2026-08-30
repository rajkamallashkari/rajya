require "rails_helper"

RSpec.describe Attachment do
  it "maps content types onto kinds" do
    expect(described_class.kind_for("image/png")).to eq("image")
    expect(described_class.kind_for("video/mp4")).to eq("video")
    expect(described_class.kind_for("audio/ogg")).to eq("audio")
    expect(described_class.kind_for("application/pdf")).to eq("file")
  end

  it "identifies voice notes and PDFs" do
    voice = described_class.new(kind: "voice", content_type: "audio/ogg", byte_size: 1, processing_status: "pending")
    pdf = described_class.new(kind: "file", content_type: "application/pdf", byte_size: 1, processing_status: "pending")

    expect(voice).to be_voice
    expect(pdf).to be_pdf
  end
end
