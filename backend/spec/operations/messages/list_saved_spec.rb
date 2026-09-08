require "rails_helper"

RSpec.describe Messages::ListSaved do
  def saved_for(account)
    conversation = create_direct_between(account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: account, body: "Hi").value
    Messages::Save.call(message: message, actor: account).value
  end

  it "orders newest first" do
    user = create(:user)
    first = saved_for(user.account)
    first.update!(created_at: 1.hour.ago)
    second = saved_for(user.account)

    result = described_class.call(
      saved_messages: SavedMessagePolicy::Scope.new(user.account, SavedMessage.all).resolve
    )

    expect(result.value.saved_messages).to eq([ second, first ])
  end

  it "excludes other accounts" do
    user = create(:user)
    mine = saved_for(user.account)
    saved_for(create(:user).account)

    result = described_class.call(
      saved_messages: SavedMessagePolicy::Scope.new(user.account, SavedMessage.all).resolve
    )

    expect(result.value.saved_messages).to eq([ mine ])
  end
end
