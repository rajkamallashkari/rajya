require "rails_helper"

RSpec.describe Attachments::Retry do
  it "requeues a failed attachment" do
    attachment = create(:attachment, processing_status: "failed", processing_error: "unreadable")
    expect do
      result = described_class.call(attachment: attachment)
      expect(result).to be_success
      expect(result.value.processing_status).to eq("pending")
      expect(result.value.processing_error).to be_nil
    end.to have_enqueued_job(Attachments::ProcessJob).with(attachment.id)
  end

  it "rejects attachments that are not failed" do
    expect(described_class.call(attachment: create(:attachment)).error_code).to eq(:validation_failed)
  end

  it "returns not_found when media is disabled" do
    create(:feature_flag, key: "media_attachments",
                          description: FeatureFlagRegistry.description_for(:media_attachments), enabled: false)
    attachment = create(:attachment, processing_status: "failed", processing_error: "unreadable")

    expect(described_class.call(attachment: attachment).error_code).to eq(:not_found)
  end
end
