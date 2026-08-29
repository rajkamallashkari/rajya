require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Current user profile", type: :request do
  path "/api/v1/users/me" do
    get "Show the current user and account" do
      tags "Users"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "current profile" do
        schema "$ref" => "#/components/schemas/Me"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("account", "id")).to eq(user.account_id)
        end
      end
    end

    patch "Update the current profile (F-7: no phone)" do
      tags "Users"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          display_name: { type: :string },
          username: { type: :string },
          bio: { type: :string }
        }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/Me"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { display_name: "Ada", username: "ada_l", bio: "Hi", phone: "1555" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("account", "username")).to eq("ada_l")
          expect(user.reload.phone).to be_nil
        end
      end
    end

    delete "Deactivate the current account (S-3)" do
      tags "Users"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "deactivated" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(user.account.reload).to be_deactivated
        end
      end
    end
  end
end

RSpec.describe "Complete onboarding", type: :request do
  path "/api/v1/users/me/complete_onboarding" do
    post "Stamp onboarded_at" do
      tags "Users"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "onboarded" do
        schema "$ref" => "#/components/schemas/Me"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("user", "onboarded")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Email change", type: :request do
  path "/api/v1/users/me/email/change" do
    post "Request a verified email change" do
      tags "Users"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { email: { type: :string } }
      }

      response "200", "accepted" do
        schema "$ref" => "#/components/schemas/AuthAccepted"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { email: "new@example.com" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("accepted" => true)
        end
      end
    end
  end
end

RSpec.describe "Email change verify", type: :request do
  path "/api/v1/users/me/email/verify" do
    post "Confirm a verified email change" do
      tags "Users"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { code: { type: :string } }
      }

      response "200", "changed" do
        schema "$ref" => "#/components/schemas/Me"
        let(:user) { create(:user) }
        let(:code) do
          _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "email_change",
                                                destination: "new@example.com")
          raw
        end
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { code: code } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("user", "email")).to eq("new@example.com")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
