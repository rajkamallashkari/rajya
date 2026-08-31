require "rails_helper"

RSpec.describe AiPolicy do
  it "allows a human to use helpers and denies a bot" do
    human = described_class.new(create(:user).account, :ai)
    expect(human).to be_rewrite.and be_translate_text.and be_style_profile
    expect(described_class.new(create(:bot).account, :ai)).not_to be_rewrite
  end
end
