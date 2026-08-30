require "rails_helper"

RSpec.describe MessageContact do
  it "requires a display name" do
    card = build(:message_contact, display_name: "")
    expect(card).not_to be_valid
  end
end
