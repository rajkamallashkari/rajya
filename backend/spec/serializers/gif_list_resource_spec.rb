require "rails_helper"

RSpec.describe GifListResource do
  it "wraps gif hits" do
    hit = Gifs::Hit.new(id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif")
    json = described_class.new(Gifs::List.new(gifs: [ hit ])).to_h

    expect(json.fetch("gifs").sole).to include("id" => "t1", "title" => "Party")
  end
end
