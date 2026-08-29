require "swagger_helper"

# rswag requires `let(:Authorization)` to match the OpenAPI security scheme.
# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Credential password change", type: :request do
  path "/api/v1/users/me/password" do
    patch "Set or change the current user's password" do
      tags "Credentials"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          current_password: { type: :string },
          password: { type: :string },
          password_confirmation: { type: :string }
        }
      }

      response "200", "password set" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user, :google, password_digest: nil) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { password: "password12", password_confirmation: "password12" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("user").fetch("has_password")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Credential password verify", type: :request do
  path "/api/v1/users/me/verify_password" do
    post "Confirm the current password for App Lock" do
      tags "Credentials"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { password: { type: :string } }
      }

      response "200", "matched" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user, :with_password) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { password: "password12" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end
    end
  end
end

RSpec.describe "Remove email", type: :request do
  path "/api/v1/users/me/email" do
    delete "Remove the account email" do
      tags "Credentials"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user, :with_password) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end

      response "409", "last credential (F-8)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user, password_digest: nil) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("conflict")
        end
      end
    end
  end
end

RSpec.describe "Remove password", type: :request do
  path "/api/v1/users/me/password" do
    delete "Remove the account password" do
      tags "Credentials"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user, :with_password, :google) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end
    end
  end
end

RSpec.describe "Remove Google", type: :request do
  path "/api/v1/users/me/google" do
    delete "Unlink Google from the account" do
      tags "Credentials"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user, :google, :with_password) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("ok" => true)
        end
      end
    end
  end
end

RSpec.describe "Credential 403s", type: :request do
  # /me routes are structurally self-scoped; stubbing the policy is the
  # request-level proof that authorize is wired (F-1).
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on password change when the policy denies (F-1)" do
    user = create(:user, :with_password, :google)
    stub_deny(CredentialsPolicy, :update_password?)
    patch "/api/v1/users/me/password", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on password verify when the policy denies (F-1)" do
    user = create(:user, :with_password)
    stub_deny(CredentialsPolicy, :verify_password?)
    post "/api/v1/users/me/verify_password", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on password removal when the policy denies (F-1)" do
    user = create(:user, :with_password, :google)
    stub_deny(CredentialsPolicy, :destroy_password?)
    delete "/api/v1/users/me/password", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on email removal when the policy denies (F-1)" do
    user = create(:user, :with_password)
    stub_deny(CredentialsPolicy, :destroy_email?)
    delete "/api/v1/users/me/email", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on Google unlink when the policy denies (F-1)" do
    user = create(:user, :google, :with_password)
    stub_deny(CredentialsPolicy, :destroy_google?)
    delete "/api/v1/users/me/google", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on passkey index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PasskeyPolicy, :index?)
    get "/api/v1/passkeys", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on passkey registration options when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PasskeyPolicy, :create?)
    post "/api/v1/passkeys/registration_options", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on passkey register when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PasskeyPolicy, :create?)
    post "/api/v1/passkeys/register", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on lock options when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PasskeyPolicy, :lock?)
    post "/api/v1/passkeys/lock_options", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on assert lock when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PasskeyPolicy, :assert_lock?)
    post "/api/v1/passkeys/assert_lock", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
