require "swagger_helper"

# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "OTP request", type: :request do
  path "/auth/otp/request" do
    post "Request an email OTP" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { email: { type: :string } }
      }

      response "200", "accepted for existing and missing accounts (F-24)" do
        schema "$ref" => "#/components/schemas/AuthAccepted"
        let(:payload) { { email: "nobody@example.com" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("accepted" => true)
        end
      end
    end
  end
end

RSpec.describe "OTP request enumeration parity", type: :request do
  it "returns the same body for an existing account and a missing one (F-24)" do
    create(:user, email: "ada@example.com")
    post "/auth/otp/request", params: { email: "ada@example.com" }, as: :json
    existing = { status: response.status, body: response.parsed_body }

    post "/auth/otp/request", params: { email: "missing@example.com" }, as: :json
    missing = { status: response.status, body: response.parsed_body }

    expect(missing).to eq(existing)
  end
end

RSpec.describe "OTP verify", type: :request do
  path "/auth/otp/verify" do
    post "Verify an email OTP" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string },
          code: { type: :string }
        }
      }

      response "200", "signed in" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user) }
        let(:code) do
          _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "login", destination: user.email)
          raw
        end
        let(:payload) { { email: user.email, code: code } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("token")).to be_present
        end
      end

      response "422", "code invalid" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) { { email: "nobody@example.com", code: "000000" } }

        run_test!
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
