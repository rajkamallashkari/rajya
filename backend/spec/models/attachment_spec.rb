require "rails_helper"

RSpec.describe Attachment do
  it "maps content types onto kinds" do
    expect(described_class.kind_for("image/png")).to eq("image")
    expect(described_class.kind_for("video/mp4")).to eq("video")
    expect(described_class.kind_for("audio/ogg")).to eq("audio")
    expect(described_class.kind_for("application/pdf")).to eq("file")
  end
end
