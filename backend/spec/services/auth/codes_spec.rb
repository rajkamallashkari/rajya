require "rails_helper"

RSpec.describe Auth::Codes do
  include ActiveSupport::Testing::TimeHelpers
  let(:user) { create(:user) }

  describe ".generate_otp" do
    it "uses SecureRandom rather than rand (F-23)" do
      allow(SecureRandom).to receive(:random_number).and_return(42)

      expect(described_class.generate_otp).to eq("000042")
      expect(SecureRandom).to have_received(:random_number)
    end

    it "honours otp_length from Settings without a restart" do
      allow(Settings).to receive(:fetch).and_call_original
      allow(Settings).to receive(:fetch).with(:otp_length).and_return(4)
      allow(SecureRandom).to receive(:random_number).and_return(7)

      expect(described_class.generate_otp).to eq("0007")
    end
  end

  describe ".issue_otp!" do
    it "persists a bcrypt digest and returns the raw code" do
      record, raw = described_class.issue_otp!(user: user, purpose: "login", destination: user.email)

      expect(raw).to match(/\A\d{6}\z/)
      expect(BCrypt::Password.new(record.code_digest)).to eq(raw)
      expect(record.purpose).to eq("login")
    end

    it "consumes previously active codes for the same purpose" do
      old, = described_class.issue_otp!(user: user, purpose: "login", destination: user.email)
      described_class.issue_otp!(user: user, purpose: "login", destination: user.email)

      expect(old.reload).to be_consumed
    end
  end

  describe ".verify_otp" do
    it "returns the credential for the matching code" do
      record, raw = described_class.issue_otp!(user: user, purpose: "login", destination: user.email)

      expect(described_class.verify_otp(user: user, purpose: "login", code: raw)).to eq(record)
      expect(record.reload).to be_consumed
    end

    it "rejects a missing user after dummy bcrypt work (F-24)" do
      expect(described_class.verify_otp(user: nil, purpose: "login", code: "000000")).to be_nil
    end

    it "increments attempts on a mismatch and then rejects" do
      record, = described_class.issue_otp!(user: user, purpose: "login", destination: user.email)

      expect(described_class.verify_otp(user: user, purpose: "login", code: "000000")).to be_nil
      expect(record.reload.attempts).to eq(1)
    end

    it "rejects after the configured attempt cap even with the right code" do
      record, raw = described_class.issue_otp!(user: user, purpose: "login", destination: user.email)
      record.update!(attempts: Settings.fetch(:rate_limit_otp_verification))

      expect(described_class.verify_otp(user: user, purpose: "login", code: raw)).to be_nil
    end

    it "rejects an expired or missing credential" do
      expect(described_class.verify_otp(user: user, purpose: "login", code: "000000")).to be_nil
    end
  end

  describe ".issue_token! / .verify_token" do
    it "looks up a magic-link token by SHA-256 digest" do
      record, raw = described_class.issue_token!(
        user: user, purpose: "login", destination: user.email, ttl_key: :magic_link_ttl
      )

      expect(described_class.verify_token(purpose: "login", raw_token: raw)).to eq(record)
      expect(described_class.verify_token(purpose: "login", raw_token: raw)).to be_nil
    end

    it "rejects an expired token" do
      _record, raw = described_class.issue_token!(
        user: user, purpose: "password_reset", destination: user.email, ttl_key: :password_reset_ttl
      )
      travel_to(2.days.from_now) do
        expect(described_class.verify_token(purpose: "password_reset", raw_token: raw)).to be_nil
      end
    end

    it "returns nil for an unknown token" do
      expect(described_class.verify_token(purpose: "login", raw_token: "nope")).to be_nil
    end
  end

  describe ".dummy_work" do
    it "runs bcrypt so unknown-account paths share a timing class (F-24)" do
      expect(described_class.dummy_work).to be_a(BCrypt::Password)
    end
  end

  describe ".bcrypt_match?" do
    it "rejects a digest that is not a bcrypt hash" do
      expect(described_class.send(:bcrypt_match?, "deadbeef", "000000")).to be(false)
    end

    it "rescues an invalid bcrypt digest that still has the prefix" do
      expect(described_class.send(:bcrypt_match?, "$2notavalidhash", "000000")).to be(false)
    end
  end
end
