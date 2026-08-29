require "rails_helper"

RSpec.describe Auth::Token do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user) }

  describe ".encode / .decode" do
    it "round-trips the user id, account id and credentials epoch" do
      payload = described_class.decode(described_class.encode(user))

      expect(payload["sub"].to_i).to eq(user.id)
      expect(payload["account_id"].to_i).to eq(user.account_id)
      expect(payload["credentials_epoch"].to_i).to eq(user.credentials_epoch)
    end

    it "signs with JWT_SECRET when it is set" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("JWT_SECRET", Rails.application.secret_key_base).and_return("spec-jwt-secret")
      token = described_class.encode(user)
      payload, = JWT.decode(token, "spec-jwt-secret", true, { algorithm: described_class::ALGORITHM })

      expect(payload["sub"].to_i).to eq(user.id)
    end
  end

  describe ".decode" do
    it "raises ExpiredError when the token is past exp" do
      allow(Settings).to receive(:fetch).and_call_original
      allow(Settings).to receive(:fetch).with(:session_lifetime).and_return(1)
      token = described_class.encode(user)

      travel 2.seconds do
        expect { described_class.decode(token) }.to raise_error(described_class::ExpiredError)
      end
    end

    it "raises DecodeError for a token signed with a different secret" do
      token = JWT.encode({ sub: user.id }, "other-secret", described_class::ALGORITHM)

      expect { described_class.decode(token) }.to raise_error(described_class::DecodeError)
    end
  end
end
