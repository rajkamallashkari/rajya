require "rails_helper"

RSpec.describe PasskeyPolicy do
  let(:user) { create(:user) }
  let(:passkey) { create(:passkey, user: user) }

  it "allows a human owner to index and create" do
    policy = described_class.new(user.account, passkey)

    expect(policy).to be_index
    expect(policy).to be_create
  end

  it "allows a human owner to lock and assert" do
    policy = described_class.new(user.account, passkey)

    expect(policy).to be_lock
    expect(policy).to be_assert_lock
  end

  it "allows a human owner to update and destroy their passkey" do
    policy = described_class.new(user.account, passkey)

    expect(policy).to be_update
    expect(policy).to be_destroy
  end

  it "forbids another human from updating or destroying the passkey" do
    policy = described_class.new(create(:user).account, passkey)

    expect(policy).not_to be_update
    expect(policy).not_to be_destroy
  end

  it "forbids a nil account from indexing or scoping" do
    expect(described_class.new(nil, Passkey)).not_to be_index
    expect(described_class::Scope.new(nil, Passkey.all).resolve).to be_empty
  end

  it "forbids a bot account from indexing" do
    expect(described_class.new(create(:account, :bot_kind), Passkey)).not_to be_index
  end

  it "forbids a human account that has no user" do
    expect(described_class.new(create(:account), Passkey)).not_to be_index
  end

  describe described_class::Scope do
    it "returns only the acting human's passkeys" do
      mine = create(:passkey, user: user)
      create(:passkey)
      resolved = described_class.new(user.account, Passkey.all).resolve

      expect(resolved).to contain_exactly(mine)
    end

    it "returns none for an account without a user" do
      expect(described_class.new(create(:account, :bot_kind), Passkey.all).resolve).to be_empty
    end
  end
end
