require "rails_helper"

RSpec.describe Search::AccountHits do
  it "matches username and name only when discoverable_by_username is on (BR-46)" do
    viewer = create(:user)
    visible = create(:user, account: create(:account, username: "visible_raj", display_name: "Visible Raj"))
    hidden = create(:user, account: create(:account, username: "hidden_raj", display_name: "Hidden Raj"))
    create(:preference, account: hidden.account, data: { "privacy" => { "discoverable_by_username" => false } })

    hits = described_class.call(account: viewer.account, query: "raj")

    expect(hits.map(&:id)).to eq([ visible.account.id ])
    expect(described_class.call(account: viewer.account, query: "@visible_raj").sole.id).to eq(visible.account.id)
  end

  it "requires an exact email match and the email gate (BR-45)" do
    viewer = create(:user)
    target = create(:user, email: "findme@example.com")
    expect(described_class.call(account: viewer.account, query: "findme@example.com")).to eq([])

    create(:preference, account: target.account, data: { "privacy" => { "discoverable_by_email" => true } })
    expect(described_class.call(account: viewer.account, query: "findme@example.com").sole.id).to eq(target.account.id)
    expect(described_class.call(account: viewer.account, query: "FINDME@example.com").sole.id).to eq(target.account.id)
  end

  it "requires an exact phone match and the phone gate (BR-45)" do
    viewer = create(:user)
    target = create(:user)
    target.update!(phone: "+15550001111")
    expect(described_class.call(account: viewer.account, query: "+15550001111")).to eq([])

    create(:preference, account: target.account, data: { "privacy" => { "discoverable_by_phone" => true } })
    expect(described_class.call(account: viewer.account, query: "+15550001111").sole.id).to eq(target.account.id)
  end

  it "excludes blocked accounts in both directions (NR-1)" do
    viewer = create(:user)
    blocked = create(:user, account: create(:account, username: "blocked_raj", display_name: "Blocked"))
    reverse = create(:user, account: create(:account, username: "reverse_raj", display_name: "Reverse"))
    create(:block, blocker_account: viewer.account, blocked_account: blocked.account)
    create(:block, blocker_account: reverse.account, blocked_account: viewer.account)

    hits = described_class.call(account: viewer.account, query: "raj")

    expect(hits.map(&:username)).to eq([])
  end

  it "returns nothing when the query or @ token is shorter than the setting" do
    viewer = create(:user)
    expect(described_class.call(account: viewer.account, query: "a")).to eq([])
    expect(described_class.call(account: viewer.account, query: "@a")).to eq([])
  end
end
