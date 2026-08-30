require "rails_helper"

RSpec.describe Attachments::TranscribeJob do
  it "delegates to Attachments::Transcribe" do
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg")
    allow(Attachments::Transcribe).to receive(:call).and_return(Result.success(attachment))

    described_class.perform_now(attachment.id)

    expect(Attachments::Transcribe).to have_received(:call).with(attachment_id: attachment.id)
  end

  it "retries StandardError using the transcribe retry setting" do
    expect(described_class.retry_attempts).to eq(Settings.fetch(:transcribe_retry_attempts))
    expect(described_class.rescue_handlers.map(&:first)).to include("StandardError")
  end

  it "marks the transcript failed when retries are exhausted (F-17)" do
    attachment = create(:attachment, kind: "voice", content_type: "audio/ogg")
    allow(Attachments::Transcribe).to receive(:call).and_raise(StandardError, "boom")
    job = described_class.new(attachment.id)
    job.exception_executions = { "[StandardError]" => described_class.retry_attempts }

    job.perform_now

    expect(attachment.reload.transcript_status).to eq("failed")
  end

  it "does not raise when retries are exhausted for a missing attachment" do
    allow(Attachments::Transcribe).to receive(:call).and_raise(StandardError, "boom")
    job = described_class.new(0)
    job.exception_executions = { "[StandardError]" => described_class.retry_attempts }

    expect { job.perform_now }.not_to raise_error
  end
end
