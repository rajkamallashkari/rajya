require "rails_helper"

RSpec.describe SavedReplyResource do
  it "serializes shortcut and body" do
    row = create(:saved_reply, shortcut: "/omw", body: "On my way")
    json = described_class.new(row).to_h

    expect(json).to include("shortcut" => "/omw", "body" => "On my way", "position" => 0)
  end
end
