require "rails_helper"

RSpec.describe AccountProfileResource do
  let(:account) { create(:account, :bot_kind) }
  let(:profile) { Accounts::ShowProfile::Profile.new(account: account, blocked_by_viewer: true) }
  let(:expected) do
    {
      "id" => account.id,
      "username" => account.username,
      "display_name" => account.display_name,
      "kind" => account.kind,
      "avatar_url" => nil,
      "bio" => account.bio,
      "shared_memory" => true,
      "blocked_by_viewer" => true
    }
  end

  it "serializes the public account and viewer block state" do
    expect(described_class.new(profile).to_h).to eq(expected)
  end

  it "serializes contact fields when the profile exposes them" do
    profile.email = "owner@example.com"
    profile.phone = "+12025550147"

    expect(described_class.new(profile).to_h).to include(
      "email" => profile.email,
      "phone" => profile.phone
    )
  end
end
