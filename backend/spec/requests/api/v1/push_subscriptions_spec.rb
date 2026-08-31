require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/MultipleDescribes -- nested browser JSON vs rswag paths
RSpec.describe "Push subscriptions", type: :request do
  path "/api/v1/push_subscriptions/vapid" do
    get "VAPID public key" do
      tags "Push"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/VapidKey"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          json = JSON.parse(response.body)
          expect(json).to have_key("public_key")
        end
      end
    end
  end

  path "/api/v1/push_subscriptions" do
    post "Register a Web Push subscription" do
      tags "Push"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          endpoint: { type: :string },
          keys: {
            type: :object,
            properties: {
              p256dh: { type: :string },
              auth: { type: :string }
            }
          }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/WebPushSubscription"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          { endpoint: "https://push.example/new", keys: { p256dh: "k", auth: "a" } }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("endpoint")).to eq("https://push.example/new")
        end
      end
    end

    delete "Remove a Web Push subscription" do
      tags "Push"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :endpoint, in: :query, type: :string

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:row) { create(:web_push_subscription, user: user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:endpoint) { row.endpoint }

        run_test! do
          expect(WebPushSubscription.where(id: row.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Push subscription nested params", type: :request do
  it "accepts the browser PushSubscription JSON shape" do
    user = create(:user)
    post "/api/v1/push_subscriptions", headers: auth_headers_for(user), as: :json, params: {
      subscription: { endpoint: "https://push.example/nested", keys: { p256dh: "pk", auth: "ak" } }
    }
    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body).fetch("endpoint")).to eq("https://push.example/nested")
  end

  it "accepts flat p256dh and auth keys" do
    user = create(:user)
    post "/api/v1/push_subscriptions", headers: auth_headers_for(user), as: :json, params: {
      endpoint: "https://push.example/flat", p256dh: "pk", auth: "ak"
    }
    expect(response).to have_http_status(:created)
  end
end
# rubocop:enable RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
