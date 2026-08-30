require "rails_helper"

RSpec.describe Attachments::ProcessJob do
  it "delegates to Attachments::Process" do
    attachment = create(:attachment)
    allow(Attachments::Process).to receive(:call).and_return(Result.success(attachment))

    described_class.perform_now(attachment.id)

    expect(Attachments::Process).to have_received(:call).with(attachment_id: attachment.id)
  end

  it "retries StandardError using the media retry setting (F-17)" do
    expect(described_class.retry_attempts).to eq(Settings.fetch(:media_process_retry_attempts))
    expect(described_class.rescue_handlers.map(&:first)).to include("StandardError")
  end

  it "marks the attachment failed when retries are exhausted (F-17)" do
    attachment = create(:attachment)
    allow(Attachments::Process).to receive(:call).and_raise(StandardError, "boom")
    job = described_class.new(attachment.id)
    job.exception_executions = { "[StandardError]" => described_class.retry_attempts }

    job.perform_now

    expect(attachment.reload.processing_status).to eq("failed")
    expect(attachment.processing_error).to eq("unreadable")
  end

  it "does not raise when retries are exhausted for a missing attachment" do
    allow(Attachments::Process).to receive(:call).and_raise(StandardError, "boom")
    job = described_class.new(0)
    job.exception_executions = { "[StandardError]" => described_class.retry_attempts }

    expect { job.perform_now }.not_to raise_error
  end
end
