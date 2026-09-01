require "rails_helper"

# rubocop:disable RSpec/MultipleExpectations -- origin matrix is one contract
RSpec.describe SecurityHeaders do
  it "covers Pages, the API, Cable, R2, OSM, and Tenor on connect-src" do
    sources = described_class.connect_sources.map(&:to_s)
    expect(sources).to include(described_class::PAGES)
    expect(sources).to include(described_class.api_origin)
    expect(sources).to include(described_class.cable_origin)
    expect(sources).to include(described_class::R2_STORAGE)
    expect(sources).to include(described_class::OSM_TILES)
    expect(sources).to include(described_class::TENOR_API)
    expect(sources).to include(described_class::TENOR_MEDIA)
    expect(sources).to include(described_class::TUNNEL_WSS)
  end

  it "maps an https API origin to wss for Cable" do
    expect(described_class.cable_origin("https://api.example")).to eq("wss://api.example")
    expect(described_class.cable_origin("http://localhost:3000")).to eq("ws://localhost:3000")
  end

  it "reads API_ORIGIN from the environment" do
    allow(ENV).to receive(:fetch).with("API_ORIGIN", described_class::LOCAL_API).and_return("https://api.example")
    expect(described_class.api_origin).to eq("https://api.example")
  end

  it "keeps img, media, font, style, script, and worker sources strict besides known CDNs" do
    expect(described_class.img_sources).to include(:self, :data, :blob, described_class::OSM_TILES)
    expect(described_class.media_sources).to include(:self, :blob, described_class::TENOR_MEDIA)
    expect(described_class.font_sources).to include(described_class::FONTS_FILES)
    expect(described_class.style_sources).to include(:unsafe_inline, described_class::FONTS_CSS)
    expect(described_class.script_sources).to eq([ :self ])
    expect(described_class.worker_sources).to include(:self, :blob)
    expect(described_class::PERMISSIONS_POLICY).to include("camera=(self)")
    expect(described_class::PERMISSIONS_POLICY).to include("display-capture=(self)")
    expect(described_class::PERMISSIONS_POLICY).to include("payment=()")
  end
end
# rubocop:enable RSpec/MultipleExpectations
