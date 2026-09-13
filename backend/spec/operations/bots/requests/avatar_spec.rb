require "rails_helper"

RSpec.describe Bots::Requests::Avatar do
  it "applies removal when the account has no avatar" do
    request = create(:bot_request, avatar_action: "remove")
    account = create(:account, :bot_kind)

    expect { described_class.apply!(request, account) }.not_to raise_error
    expect(account.avatar).not_to be_attached
  end

  it "applies replacement when the account has no previous avatar" do
    request = create(:bot_request, avatar_action: "replace")
    request.avatar.attach(blob_signed_id)
    account = create(:account, :bot_kind)

    described_class.apply!(request, account)

    expect(account.avatar).to be_attached
    expect(request.avatar).not_to be_attached
  end
end
