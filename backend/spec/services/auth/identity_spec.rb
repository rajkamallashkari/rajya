require "rails_helper"

RSpec.describe Auth::Identity do
  let(:user) { create(:user) }

  describe ".resolve" do
    it "returns the user and their account for a current token" do
      context = described_class.resolve(Auth::Token.encode(user))

      expect(context.user).to eq(user)
      expect(context.account).to eq(user.account)
    end

    it "returns nil for a missing token" do
      expect(described_class.resolve(nil)).to be_nil
    end

    it "returns nil for an empty token" do
      expect(described_class.resolve("")).to be_nil
    end

    it "returns nil when credentials_epoch no longer matches (F-6)" do
      token = Auth::Token.encode(user)
      user.revoke_all_credentials!

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when the account has been deactivated" do
      user.account.update!(deactivated_at: Time.current)

      expect(described_class.resolve(Auth::Token.encode(user.reload))).to be_nil
    end

    it "returns nil when the user no longer exists" do
      token = signed("sub" => 0, "account_id" => user.account_id, "credentials_epoch" => 0)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when credentials_epoch is missing from the payload" do
      token = signed("sub" => user.id, "account_id" => user.account_id)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil when account_id does not match the user's account" do
      token = signed("sub" => user.id, "account_id" => 0, "credentials_epoch" => user.credentials_epoch)

      expect(described_class.resolve(token)).to be_nil
    end

    it "returns nil for a token that cannot be decoded" do
      expect(described_class.resolve("not-a-jwt")).to be_nil
    end
  end

  describe ".from_http" do
    it "resolves a Bearer token from the Authorization header" do
      request = instance_double(ActionDispatch::Request, headers: { "Authorization" => "Bearer #{Auth::Token.encode(user)}" })

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
      request = instance_double(ActionDispatch::Request, params: { token: Auth::Token.encode(user) })

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
