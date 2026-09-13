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

  it "presents a transcript nobody is working on as failed (NR-33)" do
    voice = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: "pending")

    expect(voice).not_to be_transcript_stalled
    expect(voice.visible_transcript_status).to eq("pending")

    voice.update_columns(updated_at: (Settings.fetch(:transcribe_stale_after) + 1).seconds.ago)

    expect(voice).to be_transcript_stalled
    expect(voice.visible_transcript_status).to eq("failed")
  end

  it "leaves settled transcript statuses alone" do
    voice = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: "ready")
    voice.update_columns(updated_at: 1.year.ago)

    expect(voice).not_to be_transcript_stalled
    expect(voice.visible_transcript_status).to eq("ready")
  end

  it "keeps stalled media pending while exposing its retryable stalled state" do
    attachment = create(:attachment, processing_status: "pending")

    expect([ attachment.visible_processing_status, attachment.visible_processing_error ]).to eq([ "pending", nil ])

    attachment.update_columns(updated_at: (Settings.fetch(:media_process_stale_after) + 1).seconds.ago)

    expect(attachment).to be_processing_stalled
    expect(attachment.visible_processing_status).to eq("pending")
    expect(attachment.visible_processing_error).to eq("stalled")
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
