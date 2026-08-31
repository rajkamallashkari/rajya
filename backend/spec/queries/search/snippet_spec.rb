require "rails_helper"

RSpec.describe Search::Snippet do
  it "centres the snippet on the first token" do
    AppSetting.create!(key: "search_snippet_radius", value: 2, category: "search")
    expect(described_class.call("xxhelloyy", "hello")).to eq("xxhelloyy")
    expect(described_class.call("abcdefghijhelloabcdefghij", "hello")).to include("hello")
  end

  it "falls back when the token is missing" do
    expect(described_class.call("plain", "zzz")).to eq("plain")
    expect(described_class.call("plain", "???")).to eq("plain")
  end
end
