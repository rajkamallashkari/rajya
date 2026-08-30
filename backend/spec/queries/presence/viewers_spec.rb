require "rails_helper"

RSpec.describe Presence::Viewers do
  def viewers_for(owner, other, **prefs)
    create(:preference, account: owner.account, data: { "privacy" => prefs[:owner] || {} }) if prefs[:owner]
    create(:preference, account: other.account, data: { "privacy" => prefs[:other] || {} }) if prefs[:other]
    described_class.call(account: owner.account)
  end

  it "includes a counterpart when both have last_active enabled (BR-42)" do
    owner = create(:user)
    other = create(:user)

    expect(viewers_for(owner, other)).to eq([ other.account.id ])
  end

  it "omits a counterpart whose last_active is off" do
    owner = create(:user)
    other = create(:user)

    expect(viewers_for(owner, other, other: { "last_active" => false })).to eq([])
  end

  it "omits everyone when the subject has last_active off" do
    owner = create(:user)
    other = create(:user)

    expect(viewers_for(owner, other, owner: { "last_active" => false })).to eq([])
  end

  it "omits a blocked counterpart in either direction" do
    owner = create(:user)
    other = create(:user)
    create(:block, blocker_account: owner.account, blocked_account: other.account)

    expect(described_class.call(account: owner.account)).to eq([])
  end

  it "omits bots" do
    owner = create(:user)
    create(:bot)

    expect(described_class.call(account: owner.account)).to eq([])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      count.times { create(:user) }
      holder[:account] = owner.account
    end

    it "does not grow queries as the viewer set grows" do
      expect { described_class.call(account: holder.fetch(:account)) }
        .to perform_constant_number_of_queries
    end
  end
end
