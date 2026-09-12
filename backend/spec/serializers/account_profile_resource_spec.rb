require "rails_helper"

RSpec.describe AccountProfileResource do
  it "serializes the public account and viewer block state" do
    account = create(:account, :bot_kind)
    profile = Accounts::ShowProfile::Profile.new(account: account, blocked_by_viewer: true)

    expect(described_class.new(profile).to_h).to eq(
      "id" => account.id,
      "username" => account.username,
      "display_name" => account.display_name,
      "kind" => account.kind,
      "bio" => account.bio,
      "shared_memory" => true,
      "blocked_by_viewer" => true
    )
  end
end
