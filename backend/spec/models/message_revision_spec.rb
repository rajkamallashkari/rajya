require "rails_helper"

RSpec.describe MessageRevision do
  it "allows an empty previous body for attachment-only captions" do
    expect(build(:message_revision, body: "")).to be_valid
    expect(build(:message_revision, body: nil)).not_to be_valid
  end
end
