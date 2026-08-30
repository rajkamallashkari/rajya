require "rails_helper"

RSpec.describe SavedReplyPolicy do
  it "allows the owner to update and destroy" do
    user = create(:user)
    row = create(:saved_reply, account: user.account)
    policy = described_class.new(user.account, row)
    expect(policy).to be_update.and be_destroy
    expect(described_class.new(user.account, SavedReply)).to be_index.and be_create
  end

  it "denies another account and scopes to the owner" do
    user = create(:user)
    row = create(:saved_reply, account: user.account)
    expect(described_class.new(create(:user).account, row)).not_to be_update
    expect(described_class::Scope.new(user.account, SavedReply.all).resolve).to contain_exactly(row)
    expect(described_class::Scope.new(nil, SavedReply.all).resolve).to be_empty
  end

  it "denies update on a class record" do
    row = create(:saved_reply)
    expect(described_class.new(create(:user).account, SavedReply)).not_to be_update
    expect(described_class.new(nil, row)).not_to be_update
  end
end
