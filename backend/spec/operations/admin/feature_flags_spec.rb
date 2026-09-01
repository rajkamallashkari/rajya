require "rails_helper"

RSpec.describe Admin::FeatureFlags do
  let(:admin) { create(:user, :admin) }
  let(:member) { create(:user) }
  let(:account) { create(:account) }

  describe Admin::FeatureFlags::Index do
    it "shows the code default beside a missing row" do
      result = described_class.call(admin: admin)
      row = result.value.feature_flags.find { |entry| entry.fetch("key") == "webrtc_calls" }

      expect(row.fetch("default")).to be(false)
      expect(row.fetch("enabled")).to be(false)
      expect(row.fetch("overridden")).to be(false)
    end

    it "reports unregistered rows" do
      FeatureFlag.create!(key: "typo_flag", description: "typo", enabled: true)

      expect(described_class.call(admin: admin).value.unregistered_keys).to eq([ "typo_flag" ])
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member).error_code).to eq(:forbidden)
    end
  end

  describe Admin::FeatureFlags::Update do
    it "enables a flag globally without a restart" do
      result = described_class.call(admin: admin, key: "webrtc_calls", enabled: true, rollout: {})

      expect(result).to be_success
      expect(FeatureFlag.enabled?(:webrtc_calls)).to be(true)
    end

    it "applies targeted rollout by account id" do
      described_class.call(
        admin: admin, key: "webrtc_calls", enabled: false, rollout: { "account_ids" => [ account.id ] }
      )

      expect(FeatureFlag.enabled?(:webrtc_calls, account: account)).to be(true)
      expect(FeatureFlag.enabled?(:webrtc_calls)).to be(false)
    end

    it "rejects an unregistered key" do
      result = described_class.call(admin: admin, key: "not_a_real_flag", enabled: true, rollout: {})

      expect(result.error_code).to eq(:validation_failed)
      expect(FeatureFlag.find_by(key: "not_a_real_flag")).to be_nil
    end

    it "returns validation details when the override cannot be saved" do
      row = build(:feature_flag, key: "webrtc_calls")
      allow(FeatureFlag).to receive(:find_or_initialize_by).and_return(row)
      allow(row).to receive(:save).and_return(false)

      result = described_class.call(admin: admin, key: "webrtc_calls", enabled: true)

      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details).to eq(row.errors.to_hash)
    end

    it "rejects a non-admin" do
      expect(described_class.call(admin: member, key: "webrtc_calls", enabled: true).error_code).to eq(:forbidden)
    end
  end
end
