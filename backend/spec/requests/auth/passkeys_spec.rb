require "swagger_helper"

# rswag requires `let(:Authorization)` to match the OpenAPI security scheme.
# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Passkey authentication options", type: :request do
  path "/auth/passkeys/authentication_options" do
    post "WebAuthn assertion options for sign-in" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { email: { type: :string } }
      }

      response "200", "challenge issued" do
        schema "$ref" => "#/components/schemas/WebauthnOptions"
        let(:payload) { { email: "ada@example.com" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("nonce")).to be_present
        end
      end
    end
  end
end

RSpec.describe "Passkey authenticate", type: :request do
  path "/auth/passkeys/authenticate" do
    post "Sign in with a WebAuthn assertion" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          nonce: { type: :string },
          credential: { "$ref" => "#/components/schemas/WebauthnCredential" }
        }
      }

      response "200", "signed in" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user) }
        let(:client) { webauthn_client }
        let(:payload) do
          register_passkey!(user, client)
          options = Auth::Passkeys::AuthenticationOptions.call(email: user.email).value
          {
            nonce: options[:nonce] || options["nonce"],
            credential: webauthn_assertion(client, webauthn_challenge(options))
          }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("user").fetch("id")).to eq(user.id)
        end
      end

      response "401", "unknown passkey" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) do
          options = Auth::Passkeys::AuthenticationOptions.call(email: nil).value
          { nonce: options[:nonce] || options["nonce"], credential: { id: "missing" } }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("unauthenticated")
        end
      end
    end
  end
end

RSpec.describe "Passkey list", type: :request do
  path "/api/v1/passkeys" do
    get "List the current user's passkeys" do
      tags "Passkeys"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/PasskeyList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:passkey, user: user, nickname: "Laptop") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("passkeys").sole.fetch("nickname")).to eq("Laptop")
        end
      end

      response "401", "unauthenticated" do
        schema "$ref" => "#/components/schemas/Error"
        let(:Authorization) { nil }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("unauthenticated")
        end
      end
    end
  end
end

RSpec.describe "Passkey registration options", type: :request do
  path "/api/v1/passkeys/registration_options" do
    post "WebAuthn attestation options" do
      tags "Passkeys"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "challenge issued" do
        schema "$ref" => "#/components/schemas/WebauthnOptions"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("challenge")).to be_present
        end
      end
    end
  end
end

RSpec.describe "Passkey register", type: :request do
  path "/api/v1/passkeys/register" do
    post "Register a WebAuthn credential" do
      tags "Passkeys"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          nickname: { type: :string },
          credential: { "$ref" => "#/components/schemas/WebauthnCredential" }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/Passkey"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          { nickname: "MacBook", credential: webauthn_attestation(user, webauthn_client) }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("nickname")).to eq("MacBook")
        end
      end
    end
  end
end

RSpec.describe "Passkey rename", type: :request do
  path "/api/v1/passkeys/{id}" do
    patch "Rename a passkey" do
      tags "Passkeys"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :string
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { nickname: { type: :string } }
      }

      response "200", "renamed" do
        schema "$ref" => "#/components/schemas/Passkey"
        let(:user) { create(:user) }
        let(:passkey) { create(:passkey, user: user, nickname: "Old") }
        let(:id) { passkey.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { nickname: "New" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("nickname")).to eq("New")
        end
      end

      response "403", "another user's passkey" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:id) { create(:passkey).id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { nickname: "Nope" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end

RSpec.describe "Passkey destroy", type: :request do
  path "/api/v1/passkeys/{id}" do
    delete "Remove a passkey" do
      tags "Passkeys"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :string

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user, :with_password) }
        let(:passkey) { create(:passkey, user: user) }
        let(:id) { passkey.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end

      response "403", "another user's passkey" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user, :with_password) }
        let(:id) { create(:passkey).id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end

      response "409", "last credential (F-8)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user, email: nil, password_digest: nil) }
        let(:passkey) { create(:passkey, user: user) }
        let(:id) { passkey.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("conflict")
        end
      end
    end
  end
end

RSpec.describe "Passkey lock options", type: :request do
  path "/api/v1/passkeys/lock_options" do
    post "WebAuthn assertion options for App Lock" do
      tags "Passkeys"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "challenge issued" do
        schema "$ref" => "#/components/schemas/WebauthnOptions"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("userVerification")).to eq("required")
        end
      end
    end
  end
end

RSpec.describe "Passkey assert lock", type: :request do
  path "/api/v1/passkeys/assert_lock" do
    post "Verify an App Lock assertion" do
      tags "Passkeys"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { credential: { "$ref" => "#/components/schemas/WebauthnCredential" } }
      }

      response "200", "unlocked" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:client) { webauthn_client }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          register_passkey!(user, client)
          options = Auth::Passkeys::LockOptions.call(user: user).value
          { credential: webauthn_assertion(client, webauthn_challenge(options)) }
        end

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
