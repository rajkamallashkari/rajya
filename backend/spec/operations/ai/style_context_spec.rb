require "rails_helper"

RSpec.describe Ai::StyleContext do
  it "returns nil unless the account opted in with a non-blank blob (F-11)" do
    account = create(:user).account
    expect(described_class.prompt_for(nil)).to be_nil
    expect(described_class.prompt_for(account)).to be_nil

    preference = account.create_preference!(data: {})
    preference.merge_ai!("style_profile_enabled" => true, "style_profile" => { "global" => "   " })
    expect(described_class.prompt_for(account.reload)).to be_nil
  end

  it "returns nil when opted in without a stored blob" do
    account = create(:user).account
    preference = account.create_preference!(data: {})
    preference.merge_ai!("style_profile_enabled" => true)
    expect(described_class.prompt_for(account.reload)).to be_nil
  end

  it "reads a hash or string blob after opt-in" do
    account = create(:user).account
    preference = account.create_preference!(data: {})
    preference.merge_ai!("style_profile_enabled" => true, "style_profile" => { "global" => "Casual, short." })
    expect(described_class.prompt_for(account.reload)).to eq("Match this writing style: Casual, short.")

    preference.merge_ai!("style_profile" => "Direct and warm.")
    expect(described_class.prompt_for(account.reload)).to eq("Match this writing style: Direct and warm.")
  end
end
