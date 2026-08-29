require "rails_helper"

RSpec.describe Conversation do
  it "is valid as a group with a title and no direct_key" do
    expect(build(:conversation)).to be_valid
  end

  it "is valid as a direct conversation with a direct_key and no title" do
    expect(build(:conversation, :direct)).to be_valid
  end

  it "is invalid when a group conversation has a direct_key" do
    conversation = build(:conversation, direct_key: "should-not-be-set")

    expect(conversation).not_to be_valid
    expect(conversation.errors[:direct_key]).to include("must be present only for direct conversations")
  end

  it "is invalid when a direct conversation has no direct_key" do
    conversation = build(:conversation, :direct, direct_key: nil)

    expect(conversation).not_to be_valid
    expect(conversation.errors[:direct_key]).to include("must be present only for direct conversations")
  end

  it "is invalid when a non-direct conversation has no title" do
    conversation = build(:conversation, kind: "channel", title: nil)

    expect(conversation).not_to be_valid
    expect(conversation.errors[:title]).to include("can't be blank for non-direct conversations")
  end

  it "builds a sorted direct_key and exposes kind predicates" do
    expect(described_class.direct_key_for(2, 1)).to eq("1:2")
    expect(build(:conversation, :direct)).to be_direct
    expect(build(:conversation)).to be_group
    expect(build(:conversation, :channel)).to be_channel
  end
end
