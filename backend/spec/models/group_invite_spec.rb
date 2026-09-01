require "rails_helper"

RSpec.describe GroupInvite do
  it "retries token generation on a collision (BR-57)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    allow(described_class).to receive(:exists?).and_call_original
    allow(described_class).to receive(:exists?).with(token: an_instance_of(String)).and_return(true, false)
    invite = described_class.create!(conversation: conversation, created_by_account: owner.account)

    expect(invite.token).to be_present
  end

  it "keeps a supplied token" do
    invite = create(:group_invite, token: "fixed-token")
    expect(invite.token).to eq("fixed-token")
  end

  it "is unusable when expired or spent" do
    live = build(:group_invite, max_uses: 1, uses_count: 0)
    spent = build(:group_invite, max_uses: 1, uses_count: 1)
    expired = build(:group_invite, expires_at: 1.minute.ago)

    expect(live).to be_usable
    expect(spent).not_to be_usable
    expect(expired).not_to be_usable
  end

  it "redeems atomically until max_uses is reached (F-14, changes BR-58)" do
    invite = create(:group_invite, max_uses: 1, uses_count: 0)

    expect(described_class.redeem!(invite.id)).to be(true)
    expect(described_class.redeem!(invite.id)).to be(false)
    expect(invite.reload.uses_count).to eq(1)
  end

  it "does not redeem an expired invite" do
    invite = create(:group_invite, expires_at: 1.minute.ago)
    expect(described_class.redeem!(invite.id)).to be(false)
  end
end
