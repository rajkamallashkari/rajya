require "rails_helper"

RSpec.describe Flags do
  it "delegates to FeatureFlag.enabled?" do
    expect(described_class.enabled?(:async_bot_replies)).to eq(FeatureFlag.enabled?(:async_bot_replies))
  end
end
