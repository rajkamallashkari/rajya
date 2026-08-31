require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup -- rswag path groups
RSpec.describe "Calls", type: :request do
  path "/api/v1/calls" do
    post "Start a call" do
      tags "Calls"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          conversation_id: { type: :integer },
          kind: { type: :string }
        }
      }

      response "201", "ringing" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id, kind: "audio" } }

        before { enable_webrtc_calls! }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "status")).to eq("ringing")
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }
        let(:payload) { { conversation_id: conversation.id, kind: "audio" } }

        before { enable_webrtc_calls! }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end

      response "404", "flag off" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id, kind: "audio" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end

  path "/api/v1/calls/active" do
    get "Current live call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { enable_webrtc_calls! }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("call")).to be_nil
        end
      end
    end
  end

  path "/api/v1/calls/ice_servers" do
    get "ICE server credentials" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/IceServers"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { enable_webrtc_calls! }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("ice_servers")).to be_an(Array)
        end
      end
    end
  end

  path "/api/v1/calls/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Show a call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "id")).to eq(call.id)
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end

  path "/api/v1/calls/{id}/accept" do
    parameter name: :id, in: :path, type: :integer

    post "Accept a ringing call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "accepted" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(peer)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "status")).to eq("active")
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end

  path "/api/v1/calls/{id}/decline" do
    parameter name: :id, in: :path, type: :integer

    post "Decline a ringing call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "declined" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(peer)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "status")).to eq("declined")
        end
      end
    end
  end

  path "/api/v1/calls/{id}/cancel" do
    parameter name: :id, in: :path, type: :integer

    post "Cancel a ringing call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "cancelled" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "status")).to eq("missed")
        end
      end
    end
  end

  path "/api/v1/calls/{id}/hangup" do
    parameter name: :id, in: :path, type: :integer

    post "Hang up an active call" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "ended" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          row = Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
          Calls::Accept.call(account: peer.account, call: row)
          row.reload
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("call", "status")).to eq("ended")
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          Calls::Create.call(account: user.account, conversation: conversation, kind: "audio").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup
# rubocop:enable RSpec/VariableName
