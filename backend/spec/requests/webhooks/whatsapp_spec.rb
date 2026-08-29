require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "WhatsApp webhook verify", type: :request do
  path "/webhooks/whatsapp" do
    get "Meta hub challenge" do
      tags "Webhooks"
      produces "text/plain"
      parameter name: :"hub.mode", in: :query, type: :string
      parameter name: :"hub.verify_token", in: :query, type: :string
      parameter name: :"hub.challenge", in: :query, type: :string

      response "200", "subscribed" do
        let(:"hub.mode") { "subscribe" }
        let(:"hub.verify_token") { "verify-me" }
        let(:"hub.challenge") { "challenge-token" }

        before { configure_whatsapp!(token: "verify-me") }

        run_test! do |response|
          expect(response.body).to eq("challenge-token")
        end
      end
    end
  end
end

RSpec.describe "WhatsApp webhook inbound", type: :request do
  path "/webhooks/whatsapp" do
    post "Inbound WhatsApp message" do
      tags "Webhooks"
      consumes "application/json"
      produces "application/json"
      parameter name: :payload, in: :body, schema: { type: :object, additionalProperties: true }

      response "200", "accepted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:payload) { { "object" => "whatsapp_business_account", "entry" => [] } }

        before do
          configure_whatsapp!
          allow(PhoneVerifications::Inbound).to receive(:call).and_return(Result.success(nil))
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

RSpec.describe "WhatsApp webhook confirmations", type: :request do
  def post_inbound(from:, text:, secret: "hub-secret")
    body = whatsapp_inbound(from: from, text: text)
    post "/webhooks/whatsapp", params: body, headers: {
      "CONTENT_TYPE" => "application/json",
      Whatsapp::Signature::HEADER => whatsapp_signature(body, secret: secret)
    }
  end

  it "stamps the sender number when the code matches" do
    configure_whatsapp!
    user = create(:user)
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest("123456"),
                                        expires_at: 1.hour.from_now)
    post_inbound(from: "15559876543", text: "123456")

    expect(response).to have_http_status(:ok)
    expect(user.reload.phone).to eq("15559876543")
    expect(user.phone_verified_at).to be_present
  end

  it "does not stamp an expired code" do
    configure_whatsapp!
    user = create(:user)
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest("123456"),
                                        expires_at: 1.minute.ago)
    post_inbound(from: "15551111111", text: "123456")

    expect(response).to have_http_status(:ok)
    expect(user.reload.phone).to be_nil
  end

  it "lets the sender number win over a previously stored number" do
    configure_whatsapp!
    user = create(:user, phone: "15550000000")
    create(:phone_verification_request, user: user, code_digest: PhoneVerificationRequest.digest("123456"),
                                        expires_at: 1.hour.from_now)
    post_inbound(from: "15559999999", text: "123456")

    expect(user.reload.phone).to eq("15559999999")
  end

  it "rejects a missing signature" do
    configure_whatsapp!
    post "/webhooks/whatsapp", params: "{}", headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects a hub challenge with the wrong token" do
    configure_whatsapp!(token: "verify-me")
    get "/webhooks/whatsapp", params: {
      "hub.mode" => "subscribe", "hub.verify_token" => "nope", "hub.challenge" => "x"
    }

    expect(response).to have_http_status(:forbidden)
  end
end
