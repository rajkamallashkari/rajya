require "rails_helper"

RSpec.describe RateLimits do
  def attack_request(path:, http_method: "POST", params: {}, content_type: nil, body: nil, auth: nil)
    env = Rack::MockRequest.env_for(path)
    env["REQUEST_METHOD"] = http_method
    env["REMOTE_ADDR"] = "127.0.0.1"
    env["HTTP_AUTHORIZATION"] = auth if auth
    env["CONTENT_TYPE"] = content_type if content_type
    if body
      env["rack.input"] = StringIO.new(body)
    elsif params.present?
      encoded = Rack::Utils.build_query(params)
      env["rack.input"] = StringIO.new(encoded)
      env["CONTENT_TYPE"] ||= "application/x-www-form-urlencoded"
    end
    Rack::Attack::Request.new(env)
  end

  describe ".safelisted?" do
    it "allows operational and OpenAPI routes" do
      expect(described_class.safelisted?(attack_request(path: "/up", http_method: "GET"))).to be(true)
      expect(described_class.safelisted?(attack_request(path: "/health", http_method: "GET"))).to be(true)
      expect(described_class.safelisted?(attack_request(path: "/api-docs/v1/swagger.yaml", http_method: "GET"))).to be(true)
    end

    it "does not safelist application routes" do
      expect(described_class.safelisted?(attack_request(path: "/auth/login"))).to be(false)
    end
  end

  describe "discriminators" do
    it "keys login by IP and by downcased email" do
      req = attack_request(path: "/auth/login", params: { "email" => "A@Example.com" })

      expect(described_class.login_ip(req)).to be_present
      expect(described_class.login_account(req)).to eq("a@example.com")
    end

    it "reads login email from a JSON body" do
      req = attack_request(
        path: "/auth/login",
        content_type: "application/json",
        body: { email: "json@example.com" }.to_json
      )

      expect(described_class.login_account(req)).to eq("json@example.com")
    end

    it "returns nil for a login without an email" do
      expect(described_class.login_account(attack_request(path: "/auth/login"))).to be_nil
    end

    it "returns nil for login discriminators on other paths" do
      req = attack_request(path: "/auth/register", params: { "email" => "a@example.com" })

      expect(described_class.login_ip(req)).to be_nil
      expect(described_class.login_account(req)).to be_nil
    end

    it "keys Google GIS by the login IP throttle" do
      expect(described_class.login_ip(attack_request(path: "/auth/google"))).to be_present
    end

    it "keys magic-link and forgot-password issuance by email" do
      magic = attack_request(path: "/auth/magic_link/request", params: { "email" => "A@x.com" })
      forgot = attack_request(path: "/auth/forgot_password", params: { "email" => "B@x.com" })

      expect(described_class.otp_issuance_destination(magic)).to eq("a@x.com")
      expect(described_class.otp_issuance_destination(forgot)).to eq("b@x.com")
    end

    it "keys magic-link and reset verification by IP" do
      expect(described_class.otp_verification_ip(attack_request(path: "/auth/magic_link/verify"))).to be_present
      expect(described_class.otp_verification_ip(attack_request(path: "/auth/reset_password"))).to be_present
    end

    it "keys OTP issuance by email or destination" do
      expect(described_class.otp_issuance_destination(attack_request(path: "/auth/otp/request", params: { "email" => "A@x.com" }))).to eq("a@x.com")
      expect(described_class.otp_issuance_destination(attack_request(path: "/auth/otp/request", params: { "destination" => "b@x.com" }))).to eq("b@x.com")
    end

    it "returns nil when OTP issuance has no destination" do
      expect(described_class.otp_issuance_destination(attack_request(path: "/auth/otp/request"))).to be_nil
    end

    it "ignores a missing Authorization header when extracting the account id" do
      expect(described_class.jwt_account_id(attack_request(path: "/api/v1/messages"))).to be_nil
    end

    it "falls back to IP for API throttles when the JWT is missing or invalid" do
      api = attack_request(path: "/api/v1/messages")
      general = attack_request(path: "/api/v1/anything", http_method: "GET")

      expect(described_class.messages(api)).to eq(api.ip)
      expect(described_class.api_general(general)).to eq(general.ip)
    end

    it "keys authenticated API throttles by account id" do
      user = create(:user)
      auth = "Bearer #{Auth::Token.encode(user)}"
      api = attack_request(path: "/api/v1/messages", auth: auth)
      general = attack_request(path: "/api/v1/me", http_method: "GET", auth: auth)

      expect(described_class.messages(api)).to eq(user.account_id.to_s)
      expect(described_class.api_general(general)).to eq(user.account_id.to_s)
    end

    it "ignores a Bearer header that does not decode" do
      req = attack_request(path: "/api/v1/messages", auth: "Bearer not-a-jwt")

      expect(described_class.jwt_account_id(req)).to be_nil
    end

    it "ignores a non-Bearer Authorization scheme" do
      req = attack_request(path: "/api/v1/messages", auth: "Basic abc")

      expect(described_class.jwt_account_id(req)).to be_nil
    end

    it "ignores a JWT whose account_id is missing" do
      token = JWT.encode({ sub: 1 }, ENV.fetch("JWT_SECRET", Rails.application.secret_key_base), Auth::Token::ALGORITHM)
      req = attack_request(path: "/api/v1/messages", auth: "Bearer #{token}")

      expect(described_class.jwt_account_id(req)).to be_nil
    end

    it "does not key messages or general API on unrelated paths" do
      expect(described_class.messages(attack_request(path: "/auth/login"))).to be_nil
      expect(described_class.api_general(attack_request(path: "/health", http_method: "GET"))).to be_nil
    end

    it "returns an empty hash for blank or invalid JSON bodies" do
      blank = attack_request(path: "/auth/login", content_type: "application/json", body: "")
      invalid = attack_request(path: "/auth/login", content_type: "application/json", body: "not-json")
      array = attack_request(path: "/auth/login", content_type: "application/json", body: "[1]")

      expect(described_class.json_body(blank)).to eq({})
      expect(described_class.json_body(invalid)).to eq({})
      expect(described_class.json_body(array)).to eq({})
    end
  end
end
