require "rails_helper"

RSpec.describe ContactNicknames::Upsert do
  it "creates a nickname for another account" do
    owner = create(:account)
    target = create(:account)
    result = described_class.call(owner: owner, target_id: target.id, nickname: "Ada")

    expect(result).to be_success
    expect(result.value.nickname).to eq("Ada")
    expect(result.value.target_account).to eq(target)
  end

  it "updates an existing nickname" do
    nickname = create(:contact_nickname, nickname: "Old")
    result = described_class.call(
      owner: nickname.owner_account, target_id: nickname.target_account_id, nickname: "New"
    )

    expect(result.value.reload.nickname).to eq("New")
    expect(ContactNickname.where(owner_account: nickname.owner_account)).to contain_exactly(nickname)
  end

  it "rejects a missing or deactivated target" do
    owner = create(:account)
    expect(described_class.call(owner: owner, target_id: 0, nickname: "Ada").error_code).to eq(:not_found)

    gone = create(:account, :deactivated)
    expect(described_class.call(owner: owner, target_id: gone.id, nickname: "Ada").error_code).to eq(:not_found)
  end

  it "rejects a self nickname" do
    owner = create(:account)
    expect(described_class.call(owner: owner, target_id: owner.id, nickname: "Me").error_code).to eq(:validation_failed)
  end

  it "rejects a blank nickname" do
    owner = create(:account)
    expect(described_class.call(owner: owner, target_id: create(:account).id, nickname: "  ").error_code).to eq(:validation_failed)
  end

  it "rejects a nickname longer than the registered maximum" do
    owner = create(:account)
    max = Settings.fetch(:nickname_max_length)
    too_long = described_class.call(owner: owner, target_id: create(:account).id, nickname: "a" * (max + 1))

    expect(too_long.error_code).to eq(:validation_failed)
    expect(too_long.error_details[:nickname]).to be_present
  end
end
