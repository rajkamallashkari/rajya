require "rails_helper"

RSpec.describe ReceiptMark do
  it "is valid for a delivered or read mark" do
    expect(build(:receipt_mark, kind: "delivered", from_position: 0, position: 1)).to be_valid
    expect(build(:receipt_mark, kind: "read")).to be_valid
  end

  it "rejects an unknown kind" do
    expect(build(:receipt_mark, kind: "seen")).not_to be_valid
  end

  it "covers positions in (from_position, position]" do
    mark = build(:receipt_mark, from_position: 2, position: 5)

    expect(mark.covers?(2)).to be(false)
    expect(mark.covers?(3)).to be(true)
    expect(mark.covers?(5)).to be(true)
    expect(mark.covers?(6)).to be(false)
  end
end
