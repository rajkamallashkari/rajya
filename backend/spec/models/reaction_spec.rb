require "rails_helper"

RSpec.describe Reaction do
  it "rejects an emoji longer than the configured maximum" do
    stub_setting(:reaction_emoji_max_length, 1)
    reaction = build(:reaction, emoji: "toolong")
    expect(reaction).not_to be_valid
    expect(reaction.errors[:emoji]).to be_present
  end

  it "is valid at the configured maximum" do
    expect(build(:reaction)).to be_valid
  end

  it "skips the length check when emoji is blank" do
    expect(build(:reaction, emoji: nil)).not_to be_valid
  end
end
