require "rails_helper"

RSpec.describe Attachments::RetryTranscript do
  before do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:groq_api_key).and_return("gkey")
  end

  def failed_voice
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: "failed")
    attachment.file.attach(io: StringIO.new("ogg"), filename: "note.ogg", content_type: "audio/ogg")
    attachment
  end

  it "queues a new or failed voice transcript on demand" do
    [ create(:attachment, kind: "voice", content_type: "audio/ogg"), failed_voice ].each do |attachment|
      expect do
        result = described_class.call(attachment: attachment)
        expect(result).to be_success
        expect(result.value.transcript_status).to eq("pending")
      end.to have_enqueued_job(Attachments::TranscribeJob).with(attachment.id)
    end
  end

  it "queues again once a pending transcript has gone stale" do
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: "pending")
    attachment.update_columns(updated_at: (Settings.fetch(:transcribe_stale_after) + 1).seconds.ago)

    expect do
      expect(described_class.call(attachment: attachment)).to be_success
    end.to have_enqueued_job(Attachments::TranscribeJob).with(attachment.id)
  end

  it "rejects non-voice or already active transcripts" do
    expect(described_class.call(attachment: create(:attachment)).error_code).to eq(:validation_failed)
    %w[pending ready].each do |status|
      attachment = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: status)
      expect(described_class.call(attachment: attachment).error_code).to eq(:validation_failed)
    end
  end

  it "returns not_found when transcription is disabled" do
    create(:feature_flag, key: "voice_transcription",
                          description: FeatureFlagRegistry.description_for(:voice_transcription), enabled: false)

    expect(described_class.call(attachment: failed_voice).error_code).to eq(:not_found)
  end

  it "uses the global flag when the attachment has no in-memory message" do
    attachment = failed_voice
    allow(attachment).to receive(:message).and_return(nil)
    expect(described_class.call(attachment: attachment)).to be_success
  end

  it "refuses to queue when no transcription provider is configured" do
    allow(Settings).to receive(:fetch).with(:groq_api_key).and_return("")
    attachment = failed_voice

    expect { expect(described_class.call(attachment: attachment).error_code).to eq(:upstream_failed) }
      .not_to have_enqueued_job(Attachments::TranscribeJob)
    expect(attachment.reload.transcript_status).to eq("failed")
  end
end
