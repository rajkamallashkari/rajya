require "rails_helper"

RSpec.describe Messages::Blobs do
  it "parses a JSON waveform string and copies an attachment without a blob" do
    peaks = described_class.normalize_waveform("[0.2, 0.8]")
    source = create(:message)
    target = create(:message)
    create(:attachment, message: source)
    described_class.copy!(source, target)

    expect(peaks).to eq([ 0.2, 0.8 ])
    expect(target.attachments.count).to eq(1)
    expect(target.attachments.first.file).not_to be_attached
  end

  it "returns nil for a blank or invalid waveform" do
    expect(described_class.normalize_waveform(nil)).to be_nil
    expect(described_class.normalize_waveform("{")).to be_nil
    expect(described_class.normalize_waveform("{\"a\":1}")).to be_nil
  end
end
