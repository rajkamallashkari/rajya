require "rails_helper"

RSpec.describe GifResource do
  it "serializes id, title, and preview url" do
    hit = Gifs::Hit.new(id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif")
    expect(described_class.new(hit).to_h).to include("id" => "t1", "preview_url" => "https://cdn.example/p.gif")
  end
end
