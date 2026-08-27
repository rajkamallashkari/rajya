require "rails_helper"

RSpec.describe FeatureFlagEvaluator do
  let(:account) { create(:account) }

  it "returns the default when there is no row" do
    expect(described_class.enabled?(nil, default: true, account: account)).to be(true)
  end

  it "treats a missing account as not targeted" do
    row = FeatureFlag.new(enabled: false, rollout: { "account_ids" => [ account.id ] })

    expect(described_class.enabled?(row, default: false, account: nil)).to be(false)
  end

  it "reads symbol keys from the rollout hash" do
    row = FeatureFlag.new(enabled: false, rollout: { account_ids: [ account.id ] })

    expect(described_class.enabled?(row, default: false, account: account)).to be(true)
  end

  it "treats a nil rollout as empty" do
    row = FeatureFlag.new(enabled: true, rollout: nil)

    expect(described_class.enabled?(row, default: false, account: account)).to be(true)
  end

  it "enables a percentage rollout that the account id falls into" do
    row = FeatureFlag.new(enabled: true, rollout: { "percentage" => 100 })

    expect(described_class.enabled?(row, default: false, account: account)).to be(true)
  end
end
