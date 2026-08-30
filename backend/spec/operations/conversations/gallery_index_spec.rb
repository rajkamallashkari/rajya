require "rails_helper"

RSpec.describe Conversations::GalleryIndex do
  it "returns a gallery page for a known kind" do
    conversation = create_direct_between(create(:account), create(:account))
    result = described_class.call(conversation: conversation, kind: "images")

    expect(result).to be_success
    expect(result.value.items).to eq([])
  end

  it "rejects an unknown kind" do
    conversation = create_direct_between(create(:account), create(:account))
    result = described_class.call(conversation: conversation, kind: "stickers")

    expect(result.error_code).to eq(:validation_failed)
  end
end
