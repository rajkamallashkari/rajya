require "rails_helper"

RSpec.describe ContactNickname do
  it "is valid when the owner and target are different accounts (NR-41)" do
    expect(build(:contact_nickname)).to be_valid
  end

  it "is invalid when the owner and target are the same" do
    account = create(:account)
    nickname = build(:contact_nickname, owner_account: account, target_account: account)

    expect(nickname).not_to be_valid
    expect(nickname.errors[:target_account_id]).to include(Catalog.t("errors.models.contact_nickname.self"))
  end

  it "skips the self check when either account is missing" do
    nickname = described_class.new

    expect(nickname).not_to be_valid
    expect(nickname.errors[:target_account_id]).not_to include(Catalog.t("errors.models.contact_nickname.self"))
  end

  it "rejects a second nickname for the same owner and target" do
    existing = create(:contact_nickname)
    duplicate = build(:contact_nickname, owner_account: existing.owner_account, target_account: existing.target_account)

    expect(duplicate).not_to be_valid
  end

  it "rejects a nickname longer than the registered maximum" do
    max = Settings.fetch(:nickname_max_length)
    nickname = build(:contact_nickname, nickname: "a" * (max + 1))

    expect(nickname).not_to be_valid
    expect(nickname.errors[:nickname]).to include(Catalog.t("errors.models.contact_nickname.too_long", count: max))
  end

  it "skips the length check when the nickname is blank" do
    nickname = build(:contact_nickname, nickname: "")

    expect(nickname).not_to be_valid
    expect(nickname.errors[:nickname]).not_to include(a_string_matching(/too long/))
  end
end
