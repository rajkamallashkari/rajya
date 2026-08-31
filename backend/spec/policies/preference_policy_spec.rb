require "rails_helper"

RSpec.describe PreferencePolicy do
  it "allows a human to read and update their preferences" do
    policy = described_class.new(create(:user).account, Preference)

    expect(policy).to be_show
    expect(policy).to be_update
  end

  it "forbids a bot account" do
    policy = described_class.new(create(:account, :bot_kind), Preference)

    expect(policy).not_to be_show
    expect(policy).not_to be_update
  end

  it "forbids a human account that has no user" do
    expect(described_class.new(create(:account), Preference)).not_to be_show
  end
end
