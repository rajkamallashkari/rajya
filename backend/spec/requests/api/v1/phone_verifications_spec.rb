require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Phone verification issue", type: :request do
  path "/api/v1/users/me/phone/verification" do
    post "Start WhatsApp click-to-verify (NR-9)" do
      tags "Phone"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "code issued" do
        schema "$ref" => "#/components/schemas/PhoneVerification"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { configure_whatsapp! }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json.fetch("status")).to eq("pending")
          expect(json.fetch("code")).to be_present
          expect(json.fetch("wa_url")).to include("wa.me")
        end
      end
    end

    get "Phone verification status" do
      tags "Phone"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "status" do
        schema "$ref" => "#/components/schemas/PhoneVerification"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("none")
        end
      end
    end
  end
end

RSpec.describe "Admin phone verification", type: :request do
  path "/api/v1/admin/users/{user_id}/verify_phone" do
    post "Manually verify a phone number" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :user_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { phone: { type: :string } }
      }

      response "200", "verified" do
        schema "$ref" => "#/components/schemas/Me"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:user_id) { target.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { phone: "15550001111" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("user", "phone_verified")).to be(true)
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
