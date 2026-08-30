require "rails_helper"

RSpec.describe SavedReply do
  it "rejects a blank shortcut or body and an oversize shortcut" do
    expect(build(:saved_reply, shortcut: "")).not_to be_valid
    expect(build(:saved_reply, body: "")).not_to be_valid
    stub_setting(:saved_reply_shortcut_max_length, 2)
    expect(build(:saved_reply, shortcut: "/too")).not_to be_valid
  end
end
