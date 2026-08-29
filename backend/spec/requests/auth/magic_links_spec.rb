require "swagger_helper"

# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Magic link request", type: :request do
  path "/auth/magic_link/request" do
    post "Request a magic sign-in link" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { email: { type: :string } }
      }

      response "200", "accepted whether or not the account exists" do
        schema "$ref" => "#/components/schemas/AuthAccepted"
        let(:payload) { { email: "nobody@example.com" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("accepted" => true)
        end
      end
    end
  end
end

RSpec.describe "Magic link verify", type: :request do
  path "/auth/magic_link/verify" do
    post "Consume a magic sign-in token" do
      tags "Auth"
      description "POST body, not a query string — the JWT never travels in a URL (F-25 class)."
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { token: { type: :string } }
      }

      response "200", "signed in" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user) }
        let(:token) do
          _record, raw = Auth::Codes.issue_token!(
            user: user, purpose: "login", destination: user.email, ttl_key: :magic_link_ttl
          )
          raw
        end
        let(:payload) { { token: token } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("token")).to be_present
        end
      end

      response "422", "token invalid" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) { { token: "nope" } }

        run_test!
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
