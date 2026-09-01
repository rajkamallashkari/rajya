require "rails_helper"

RSpec.describe Message do
  it "requires position and revision (changes BR-32)" do
    blank = build(:message, position: nil)
    expect(blank).not_to be_valid
    expect(blank.errors[:position]).to be_present
    expect(build(:message, revision: nil)).not_to be_valid
  end

  it "is valid as a plain text message from a sender" do
    expect(build(:message)).to be_valid
  end

  it "is valid as a system message with a system_event and no sender" do
    message = build(:message, kind: "system", system_event: "member_added", sender_account: nil)

    expect(message).to be_valid
  end

  it "is invalid when a non-system message has a system_event" do
    message = build(:message, system_event: "member_added")

    expect(message).not_to be_valid
    expect(message.errors[:system_event]).to include("must be present only for system messages")
  end

  it "is invalid when a system message has an unknown system_event" do
    message = build(:message, kind: "system", system_event: "nope", sender_account: nil)

    expect(message).not_to be_valid
    expect(message.errors[:system_event]).to be_present
  end

  it "is invalid when a system message has no system_event" do
    message = build(:message, kind: "system", system_event: nil)

    expect(message).not_to be_valid
    expect(message.errors[:system_event]).to include("must be present only for system messages")
  end

  it "is invalid when a non-system message has neither a sender nor a sender_snapshot" do
    message = build(:message, sender_account: nil, sender_snapshot: {})

    expect(message).not_to be_valid
    expect(message.errors[:sender_account_id]).to include("or sender_snapshot is required for non-system messages")
  end

  it "is valid when a non-system message has a sender_snapshot but no sender_account" do
    message = build(:message, sender_account: nil, sender_snapshot: { "display_name" => "Ghost" })

    expect(message).to be_valid
  end

  it "exposes deleted? and edited?" do
    message = create(:message)
    expect(message).not_to be_deleted
    expect(message).not_to be_edited
    message.update!(deleted_at: Time.current, edited_at: Time.current)
    expect(message).to be_deleted
    expect(message).to be_edited
  end
end
