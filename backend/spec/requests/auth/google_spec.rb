require "swagger_helper"

# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Google GIS success", type: :request do
  path "/auth/google" do
    post "Sign in with a Google Identity Services auth code" do
      tags "Auth"
      description "GIS popup posts the auth code. JWT is returned in the body, never a redirect query string (F-25)."
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { code: { type: :string } }
      }

      response "200", "signed in" do
        schema "$ref" => "#/components/schemas/Session"
        let(:payload) { { code: "gis-code" } }

        before do
          allow(Auth::Google::Client).to receive(:profile_from_code).and_return(
            Auth::Google::Client::Profile.new(
              ok?: true,
              info: { "sub" => "gis-sub", "email" => "gis@example.com", "name" => "Gis" }
            )
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("user").fetch("email")).to eq("gis@example.com")
        end
      end
    end
  end
end

RSpec.describe "Google GIS upstream failure", type: :request do
  path "/auth/google" do
    post "Sign in with a Google Identity Services auth code" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { code: { type: :string } }
      }

      response "502", "Google rejected the code" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) { { code: "bad" } }

        before do
          allow(Auth::Google::Client).to receive(:profile_from_code).and_return(
            Auth::Google::Client::Profile.new(ok?: false, info: nil)
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("upstream_failed")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
