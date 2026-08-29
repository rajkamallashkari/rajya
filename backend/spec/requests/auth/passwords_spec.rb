require "swagger_helper"

# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Password registration", type: :request do
  path "/auth/register" do
    post "Register with email and password" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string },
          name: { type: :string },
          password: { type: :string },
          password_confirmation: { type: :string }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/Session"
        let(:payload) do
          { email: "ada@example.com", name: "Ada", password: "password12", password_confirmation: "password12" }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("token")).to be_present
        end
      end

      response "409", "email taken" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) do
          { email: "ada@example.com", name: "Ada", password: "password12", password_confirmation: "password12" }
        end

        before { create(:user, email: "ada@example.com") }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("conflict")
        end
      end
    end
  end
end

RSpec.describe "Password login", type: :request do
  path "/auth/login" do
    post "Sign in with email and password" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string },
          password: { type: :string }
        }
      }

      response "200", "signed in" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user, :with_password, email: "ada@example.com") }
        let(:payload) { { email: user.email, password: "password12" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("user").fetch("email")).to eq(user.email)
          expect(::Session.where(user: user)).to exist
        end
      end

      response "401", "invalid credentials" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) { { email: "missing@example.com", password: "password12" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("unauthenticated")
        end
      end
    end
  end
end

RSpec.describe "Password reset request", type: :request do
  path "/auth/forgot_password" do
    post "Request a password reset email" do
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

RSpec.describe "Password reset consume", type: :request do
  path "/auth/reset_password" do
    post "Consume a password reset token" do
      tags "Auth"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          token: { type: :string },
          password: { type: :string },
          password_confirmation: { type: :string }
        }
      }

      response "200", "password updated" do
        schema "$ref" => "#/components/schemas/Session"
        let(:user) { create(:user, :with_password) }
        let(:token) do
          _record, raw = Auth::Codes.issue_token!(
            user: user, purpose: "password_reset", destination: user.email, ttl_key: :password_reset_ttl
          )
          raw
        end
        let(:payload) { { token: token, password: "newpass12", password_confirmation: "newpass12" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("token")).to be_present
        end
      end

      response "422", "token invalid" do
        schema "$ref" => "#/components/schemas/Error"
        let(:payload) { { token: "nope", password: "newpass12", password_confirmation: "newpass12" } }

        run_test!
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
