require "rails_helper"

RSpec.describe SavedReplyListResource do
  it "wraps saved replies" do
    row = create(:saved_reply)
    json = described_class.new(SavedReplies::List.new(saved_replies: [ row ])).to_h

    expect(json.fetch("saved_replies").sole.fetch("id")).to eq(row.id)
  end
end
