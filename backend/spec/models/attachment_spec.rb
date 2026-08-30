require "rails_helper"

RSpec.describe Attachment do
  it "maps content types onto kinds" do
    expect(described_class.kind_for("image/png")).to eq("image")
    expect(described_class.kind_for("video/mp4")).to eq("video")
    expect(described_class.kind_for("audio/ogg")).to eq("audio")
    expect(described_class.kind_for("application/pdf")).to eq("file")
  end

  it "identifies voice notes and PDFs" do
    voice = build(:attachment, kind: "voice", content_type: "audio/ogg")
    pdf = build(:attachment, kind: "file", content_type: "application/pdf")

    expect(voice).to be_voice
    expect(pdf).to be_pdf
  end

  it "accepts pending transcripts and rejects unknown statuses" do
    voice = build(:attachment, kind: "voice", content_type: "audio/ogg")
    expect(voice).to be_valid
    voice.transcript_status = "pending"
    expect(voice).to be_valid
    voice.transcript_status = "nope"
    expect(voice).not_to be_valid
  end
end
