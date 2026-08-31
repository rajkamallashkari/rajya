require "rails_helper"

RSpec.describe Attachments::Transcribe do
  def voice_attachment
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    attachment = create(:attachment, message: message, kind: "voice", content_type: "audio/ogg")
    attachment.file.attach(io: StringIO.new("ogg"), filename: "note.ogg", content_type: "audio/ogg")
    attachment
  end

  it "persists a ready transcript from the AI runner" do
    attachment = voice_attachment
    outcome = Ai::Runner::Result.new(
      transcript: Ai::Providers::Groq::Transcript.new(text: "hello", language: "en"),
      status: "success", provider: "groq", model: "whisper-large-v3"
    )
    allow(Ai::Runner).to receive(:transcribe).and_return(outcome)
    allow(Realtime).to receive(:publish)

    described_class.call(attachment: attachment)

    expect(attachment.reload).to have_attributes(transcript: "hello", transcript_language: "en", transcript_status: "ready")
    expect(Realtime).to have_received(:publish)
  end

  it "marks transcript_status failed when Groq quota is exhausted (F-17)" do
    attachment = voice_attachment
    allow(Ai::Runner).to receive(:transcribe).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "quota_exhausted", provider: "groq", model: "w")
    )

    described_class.call(attachment: attachment)

    expect(attachment.reload.transcript_status).to eq("failed")
    expect(attachment.processing_status).not_to eq("failed")
  end

  it "does not call Groq when the flag is off and clears a pending row" do
    attachment = voice_attachment
    attachment.update!(transcript_status: "pending")
    create(:feature_flag, key: "voice_transcription",
                          description: FeatureFlagRegistry.description_for(:voice_transcription), enabled: false)
    allow(Ai::Runner).to receive(:transcribe)

    described_class.call(attachment: attachment)

    expect(Ai::Runner).not_to have_received(:transcribe)
    expect(attachment.reload.transcript_status).to be_nil
  end

  it "leaves a nil transcript when the flag is off" do
    attachment = voice_attachment
    create(:feature_flag, key: "voice_transcription",
                          description: FeatureFlagRegistry.description_for(:voice_transcription), enabled: false)
    allow(Ai::Runner).to receive(:transcribe)

    described_class.call(attachment: attachment)

    expect(Ai::Runner).not_to have_received(:transcribe)
    expect(attachment.reload.transcript_status).to be_nil
  end

  it "no-ops for a missing row or a non-voice attachment" do
    expect(described_class.call(attachment_id: 0).value).to be_nil
    image = create(:attachment)
    expect(described_class.call(attachment: image).value.transcript_status).to be_nil
  end

  it "fails visibly when the voice blob is missing" do
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg")

    described_class.call(attachment: attachment)

    expect(attachment.reload.transcript_status).to eq("failed")
  end

  it "does not raise when fail_record! is given a missing row" do
    expect { described_class.new.fail_record!(nil) }.not_to raise_error
  end

  it "uses the global flag when the attachment has no in-memory message" do
    attachment = voice_attachment
    allow(attachment).to receive(:message).and_return(nil)
    allow(Ai::Runner).to receive(:transcribe).and_return(
      Ai::Runner::Result.new(
        transcript: Ai::Providers::Groq::Transcript.new(text: "solo", language: "en"),
        status: "success", provider: "groq", model: "whisper-large-v3"
      )
    )

    described_class.call(attachment: attachment)

    expect(attachment.reload.transcript).to eq("solo")
  end
end
