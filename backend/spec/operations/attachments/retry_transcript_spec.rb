require "rails_helper"

RSpec.describe Attachments::RetryTranscript do
  def failed_voice
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg", transcript_status: "failed")
    attachment.file.attach(io: StringIO.new("ogg"), filename: "note.ogg", content_type: "audio/ogg")
    attachment
  end

  it "requeues a failed voice transcript" do
    attachment = failed_voice
    expect do
      result = described_class.call(attachment: attachment)
      expect(result).to be_success
      expect(result.value.transcript_status).to eq("pending")
    end.to have_enqueued_job(Attachments::TranscribeJob).with(attachment.id)
  end

  it "rejects non-voice or non-failed attachments" do
    expect(described_class.call(attachment: create(:attachment, kind: "voice", content_type: "audio/ogg")).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(attachment: create(:attachment)).error_code).to eq(:validation_failed)
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
end
