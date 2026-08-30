require "rails_helper"

RSpec.describe Conversations::FindOrCreateDirect do
  it "creates a DM keyed by sorted account ids and returns it on a second call (F-13)" do
    alice = create(:user).account
    bob = create(:account)
    first = described_class.call(creator: alice, account_id: bob.id).value.conversation
    second = described_class.call(creator: bob, account_id: alice.id).value.conversation

    expect(first.direct_key).to eq(Conversation.direct_key_for(alice.id, bob.id))
    expect(second.id).to eq(first.id)
    expect(first.conversation_memberships.map(&:role).uniq).to eq(%w[member])
  end

  it "creates a self-chat when no other account is given" do
    account = create(:user).account
    conversation = described_class.call(creator: account, account_id: nil).value.conversation

    expect(conversation.direct_key).to eq(Conversation.direct_key_for(account.id, account.id))
    expect(conversation.conversation_memberships.map(&:account_id)).to eq([ account.id ])
  end

  it "returns not_found for a missing account or a blocked new DM (NR-1)" do
    alice = create(:user).account
    bob = create(:account)
    create(:block, blocker_account: alice, blocked_account: bob)

    expect(described_class.call(creator: alice, account_id: Account.maximum(:id).to_i + 1).error_code)
      .to eq(:not_found)
    expect(described_class.call(creator: alice, account_id: bob.id).error_code).to eq(:not_found)
    expect(described_class.call(creator: bob, account_id: alice.id).error_code).to eq(:not_found)
  end

  it "returns an existing DM even when the accounts later block each other" do
    alice = create(:user).account
    bob = create(:account)
    existing = described_class.call(creator: alice, account_id: bob.id).value.conversation
    create(:block, blocker_account: alice, blocked_account: bob)

    expect(described_class.call(creator: alice, account_id: bob.id).value.conversation.id).to eq(existing.id)
  end

  it "recovers from a direct_key race by returning the winning row (F-13)" do
    alice = create(:user).account
    bob = create(:account)
    key = Conversation.direct_key_for(alice.id, bob.id)
    winner = create_direct_between(alice, bob)
    allow(Conversation).to receive(:find_by).with(direct_key: key).and_return(nil)
    allow(Conversation).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique)
    allow(Conversation).to receive(:find_by!).with(direct_key: key).and_return(winner)

    expect(described_class.call(creator: alice, account_id: bob.id).value.conversation).to eq(winner)
  end
end
