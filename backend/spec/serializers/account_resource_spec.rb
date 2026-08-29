require "rails_helper"

# S-22: nicknames are private to the owner. Search, mentions, and member lists
# serialize accounts through AccountResource (P3/P8); this spec is the contract
# those surfaces inherit.
RSpec.describe AccountResource do
  it "never includes nickname on AccountResource, Me, Session, or Block payloads" do
    owner = create(:user)
    target = create(:account)
    create(:contact_nickname, owner_account: owner.account, target_account: target, nickname: "SecretName")

    expect(described_class.new(target).to_h.keys).not_to include("nickname")
    expect(MeResource.new(Users::Me.new(account: owner.account, user: owner)).to_h.fetch("account").keys)
      .not_to include("nickname")
    expect(SessionResource.new(Auth::Session.issue(owner)).to_h.fetch("account").keys).not_to include("nickname")
    block = create(:block, blocker_account: owner.account, blocked_account: target)
    expect(BlockResource.new(block).to_h.fetch("account").keys).not_to include("nickname")
  end
end
