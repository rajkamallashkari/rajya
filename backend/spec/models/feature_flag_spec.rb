require "rails_helper"

RSpec.describe FeatureFlag do
  let(:account) { create(:account) }

  describe ".enabled?" do
    it "returns the production YAML default when no row exists" do
      expect(described_class.enabled?(:async_bot_replies)).to be(true)
      expect(described_class.enabled?(:webrtc_calls)).to be(false)
    end

    it "honours a global DB override without a restart" do
      described_class.create!(key: "webrtc_calls", description: FeatureFlagRegistry.description_for(:webrtc_calls), enabled: true)

      expect(described_class.enabled?(:webrtc_calls)).to be(true)
    end

    it "invalidates the cache when the row is updated" do
      flag = described_class.create!(key: "webrtc_calls", description: FeatureFlagRegistry.description_for(:webrtc_calls), enabled: true)
      expect(described_class.enabled?(:webrtc_calls)).to be(true)

      flag.update!(enabled: false)

      expect(described_class.enabled?(:webrtc_calls)).to be(false)
    end

    it "enables a dark flag for a targeted account_id" do
      described_class.create!(
        key: "webrtc_calls",
        description: FeatureFlagRegistry.description_for(:webrtc_calls),
        enabled: false,
        rollout: { "account_ids" => [ account.id ] }
      )

      expect(described_class.enabled?(:webrtc_calls, account: account)).to be(true)
      expect(described_class.enabled?(:webrtc_calls)).to be(false)
    end

    it "applies percentage rollout against the account id" do
      described_class.create!(
        key: "webrtc_calls",
        description: FeatureFlagRegistry.description_for(:webrtc_calls),
        enabled: true,
        rollout: { "percentage" => 0 }
      )

      expect(described_class.enabled?(:webrtc_calls, account: account)).to be(false)
      expect(described_class.enabled?(:webrtc_calls)).to be(false)
    end

    it "raises in local environments for an unregistered key" do
      expect { described_class.enabled?(:not_a_real_flag) }.to raise_error(FeatureFlagRegistry::UnregisteredKey)
    end

    it "fails closed in production for an unregistered key" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

      expect(described_class.enabled?(:not_a_real_flag)).to be(false)
    end
  end
end
