require "rails_helper"

RSpec.describe StickerPacks::Create do
  it "creates an unpublished pack for the acting account" do
    account = create(:user).account
    result = described_class.call(account: account, name: " Waves ", kind: "sticker")

    expect(result).to be_success
    expect(result.value).to have_attributes(owner_account: account, slug: "waves", kind: "sticker", published_at: nil)
  end

  it "rejects a missing account, bad kind, and duplicate slug" do
    account = create(:user).account
    expect(described_class.call(account: nil, name: "A", kind: "sticker").error_code).to eq(:forbidden)
    expect(described_class.call(account: account, name: "A", kind: "nope").error_code).to eq(:validation_failed)
    described_class.call(account: account, name: "A", kind: "emoji", slug: "same")
    expect(described_class.call(account: account, name: "B", kind: "emoji", slug: "same").error_code)
      .to eq(:validation_failed)
  end

  it "lets an admin create a system pack and rejects a member (S-19)" do
    admin = create(:user, :admin)
    member = create(:user)
    result = described_class.call(account: admin.account, name: "System", kind: "sticker", system: true)

    expect(result.value).to be_system
    expect(described_class.call(account: member.account, name: "Nope", kind: "sticker", system: true).error_code)
      .to eq(:forbidden)
    expect(described_class.call(account: create(:account), name: "Nope", kind: "sticker", system: true).error_code)
      .to eq(:forbidden)
  end
end
