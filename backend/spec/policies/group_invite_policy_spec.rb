require "rails_helper"

RSpec.describe GroupInvitePolicy do
  it "allows anyone to preview and only humans to join" do
    invite = build(:group_invite)
    expect(described_class.new(nil, invite)).to be_preview
    expect(described_class.new(create(:user).account, invite)).to be_join
    expect(described_class.new(create(:bot).account, invite)).not_to be_join
  end

  it "resolves an empty scope" do
    expect(described_class::Scope.new(create(:user).account, GroupInvite.all).resolve).to be_empty
  end
end
