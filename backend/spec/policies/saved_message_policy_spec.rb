require "rails_helper"

RSpec.describe SavedMessagePolicy do
  def saved_for(account)
    conversation = create_direct_between(account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: account, body: "Hi").value
    Messages::Save.call(message: message, actor: account).value
  end

  it "allows an acting account to list" do
    expect(described_class.new(create(:user).account, SavedMessage)).to be_index
    expect(described_class.new(nil, SavedMessage)).not_to be_index
  end

  it "scopes saves to the acting account" do
    user = create(:user)
    mine = saved_for(user.account)
    saved_for(create(:user).account)

    expect(described_class::Scope.new(user.account, SavedMessage.all).resolve).to contain_exactly(mine)
  end

  it "returns none without an acting account" do
    saved_for(create(:user).account)
    expect(described_class::Scope.new(nil, SavedMessage.all).resolve).to be_empty
  end
end
