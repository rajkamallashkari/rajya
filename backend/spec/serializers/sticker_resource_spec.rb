require "rails_helper"

RSpec.describe StickerResource do
  it "serializes shortcode and a signed url when url options are set" do
    ActiveStorage::Current.url_options = { host: "www.example.com" }
    sticker = create(:sticker, shortcode: "wave")
    json = described_class.new(sticker).to_h

    expect(json).to include("shortcode" => "wave", "sticker_pack_id" => sticker.sticker_pack_id)
    expect(json.fetch("url")).to be_present
  ensure
    ActiveStorage::Current.reset
  end

  it "omits url when generation fails" do
    sticker = create(:sticker)
    json = described_class.new(sticker).to_h
    expect(json.fetch("url")).to be_nil
  end

  it "omits url when the blob is missing" do
    sticker = create(:sticker)
    allow(sticker).to receive(:blob).and_return(nil)
    expect(described_class.new(sticker).to_h.fetch("url")).to be_nil
  end
end
