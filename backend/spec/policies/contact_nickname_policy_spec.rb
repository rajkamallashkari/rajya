require "rails_helper"

RSpec.describe ContactNicknamePolicy do
  let(:user) { create(:user) }
  let(:nickname) { create(:contact_nickname, owner_account: user.account) }

  it "allows a human to list and upsert nicknames" do
    policy = described_class.new(user.account, ContactNickname)

    expect(policy).to be_index
    expect(policy).to be_update
  end

  it "allows the owner to destroy their nickname" do
    expect(described_class.new(user.account, nickname)).to be_destroy
    expect(described_class.new(create(:user).account, nickname)).not_to be_destroy
    expect(described_class.new(user.account, ContactNickname)).not_to be_destroy
  end

  it "scopes to the acting account's nicknames" do
    mine = nickname
    create(:contact_nickname)

    expect(described_class::Scope.new(user.account, ContactNickname.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, ContactNickname.all).resolve).to be_empty
  end
end
