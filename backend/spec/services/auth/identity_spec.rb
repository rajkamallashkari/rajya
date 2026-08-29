require "rails_helper"

RSpec.describe Auth::Identity do
  let(:user) { create(:user) }

  describe ".resolve" do
    it "returns the user, account and session for a current token" do
      issued = Auth::Session.issue(user)
      context = described_class.resolve(issued.token)

      expect(context.user).to eq(user)
      expect(context.account).to eq(user.account)
      expect(context.session.jti).to eq(Auth::Token.decode(issued.token).fetch("jti"))
    end

    it "returns nil for a missing token" do
      expect(described_class.resolve(nil)).to be_nil
    end

    it "returns nil for an empty token" do
      expect(described_class.resolve("")).to be_nil
    end

    it "returns nil when credentials_epoch no longer matches (F-6)" do
      token = Auth::Session.issue(user).token
      user.revoke_all_credentials!

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when the session jti has been revoked while other sessions keep working (NR-44)" do
      first = Auth::Session.issue(user)
      second = Auth::Session.issue(user)
      ::Session.find_by!(jti: Auth::Token.decode(first.token).fetch("jti")).revoke!

      expect(described_class.resolve(first.token)).to be_nil
      expect(described_class.resolve(second.token).user).to eq(user)
    end

    it "returns nil when the revoked-jti cache cannot be read (fail closed)" do
      token = Auth::Session.issue(user).token
      allow(Auth::RevokedJtis).to receive(:read_set).and_raise(Redis::BaseError, "down")

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when the account has been deactivated" do
      user.account.update!(deactivated_at: Time.current)

      expect(described_class.resolve(Auth::Session.issue(user.reload).token)).to be_nil
    end

    it "returns nil when the matching session has expired" do
      issued = Auth::Session.issue(user)
      jti = Auth::Token.decode(issued.token).fetch("jti")
      ::Session.find_by!(jti: jti).update!(expires_at: 1.minute.ago)

      expect(described_class.resolve(issued.token)).to be_nil
    end

    it "returns nil when the user no longer exists" do
      token = signed("sub" => 0, "account_id" => user.account_id, "credentials_epoch" => 0, "jti" => SecureRandom.uuid)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when credentials_epoch is missing from the payload" do
      token = signed("sub" => user.id, "account_id" => user.account_id, "jti" => SecureRandom.uuid)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when jti is missing from the payload" do
      token = signed("sub" => user.id, "account_id" => user.account_id, "credentials_epoch" => user.credentials_epoch)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when the jti has no matching session row" do
      token = signed(
        "sub" => user.id,
        "account_id" => user.account_id,
        "credentials_epoch" => user.credentials_epoch,
        "jti" => SecureRandom.uuid
      )

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when account_id does not match the user's account" do
      token = signed("sub" => user.id, "account_id" => 0, "credentials_epoch" => user.credentials_epoch,
                     "jti" => SecureRandom.uuid)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil for a token that cannot be decoded" do
      expect(described_class.resolve("not-a-jwt")).to be_nil
    end
  end

  describe ".from_http" do
    it "resolves a Bearer token from the Authorization header" do
      request = instance_double(
        ActionDispatch::Request,
        headers: { "Authorization" => "Bearer #{Auth::Session.issue(user).token}" }
      )

      expect(described_class.from_http(request).user).to eq(user)
    end

    it "returns nil when the Authorization header is missing" do
      request = instance_double(ActionDispatch::Request, headers: { "Authorization" => nil })

      expect(described_class.from_http(request)).to be_nil
    end

    it "returns nil when the scheme is not Bearer" do
      request = instance_double(ActionDispatch::Request, headers: { "Authorization" => "Basic abc" })

      expect(described_class.from_http(request)).to be_nil
    end

    it "returns nil when Bearer is present without a token" do
      request = instance_double(ActionDispatch::Request, headers: { "Authorization" => "Bearer" })

      expect(described_class.from_http(request)).to be_nil
    end
  end

  describe ".from_cable" do
    it "resolves the token query parameter" do
      request = instance_double(ActionDispatch::Request, params: { token: Auth::Session.issue(user).token })

      expect(described_class.from_cable(request).user).to eq(user)
    end

    it "returns nil when the token query parameter is absent" do
      request = instance_double(ActionDispatch::Request, params: {})

      expect(described_class.from_cable(request)).to be_nil
    end
  end

  def signed(payload)
    payload["exp"] = 1.day.from_now.to_i
    JWT.encode(payload, ENV.fetch("JWT_SECRET", Rails.application.secret_key_base), Auth::Token::ALGORITHM)
  end
end
