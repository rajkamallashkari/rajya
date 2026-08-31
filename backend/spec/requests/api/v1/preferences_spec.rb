require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Preferences show", type: :request do
  path "/api/v1/preferences" do
    get "Fetch the current account's preference document" do
      tags "Preferences"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "defaults" do
        schema "$ref" => "#/components/schemas/Preferences"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          data = JSON.parse(response.body).fetch("data")
          expect(data.dig("appearance", "theme")).to eq("system")
          expect(data.dig("privacy", "read_receipts")).to be(true)
          expect(data.dig("ai", "style_profile_enabled")).to be(false)
          expect(data.dig("notifications", "global", "level")).to eq("all")
        end
      end
    end

    patch "Update preference keys (deep merge, registry-validated)" do
      tags "Preferences"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { data: { type: :object, additionalProperties: true } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/Preferences"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          { data: { appearance: { theme: "dark", text_size: 2 }, locale: { timezone: "Asia/Kolkata" } } }
        end

        run_test! do |response|
          data = JSON.parse(response.body).fetch("data")
          expect(data.dig("appearance", "theme")).to eq("dark")
          expect(data.dig("appearance", "text_size")).to eq(2)
          expect(data.dig("appearance", "density")).to eq("comfortable")
          expect(data.dig("locale", "timezone")).to eq("Asia/Kolkata")
        end
      end

      response "422", "unknown key" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { data: { appearance: { neon: true } } } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("validation_failed")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName

RSpec.describe "Preferences registry round-trip", type: :request do
  it "round-trips a preference added only in the registry, without a migration" do
    user = create(:user)
    headers = auth_headers_for(user)

    Preferences::Registry.with_temporary_field(
      "chat", "session_only_flag", type: :boolean, default: false
    ) do
      patch "/api/v1/preferences", headers: headers, as: :json,
            params: { data: { chat: { session_only_flag: true } } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig("data", "chat", "session_only_flag")).to be(true)

      get "/api/v1/preferences", headers: headers
      expect(JSON.parse(response.body).dig("data", "chat", "session_only_flag")).to be(true)
    end
  end
end
