require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/AnyInstance, RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup -- rswag path groups + F-1 stub
RSpec.describe "Calls", type: :request do
  path "/api/v1/calls" do
    get "List this account's calls" do
      tags "Calls"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :page, in: :query, type: :integer, required: false

      response "200", "call log" do
        schema "$ref" => "#/components/schemas/CallList"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          enable_webrtc_calls!
          conversation = create_direct_between(user.account, peer.account)
          call = create(:call, :ended, conversation: conversation, initiator_account: user.account)
          create(:call_participant, call: call, account: user.account, status: "left")
          create(:call_participant, call: call, account: peer.account, status: "left")
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("calls").sole.fetch("conversation_kind")).to eq("direct")
          expect(body.dig("calls", 0, "peer", "id")).to eq(peer.account.id)
          expect(body.dig("meta", "total")).to eq(1)
        end
      end

      response "403", "refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          enable_webrtc_calls!
          allow_any_instance_of(CallPolicy).to receive(:index?).and_return(false)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end

      response "404", "flag off" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end

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

  path "/api/v1/calls/{id}/screen_share" do
    parameter name: :id, in: :path, type: :integer

    post "Start or stop 1:1 screen share" do
      tags "Calls"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          sharing: { type: :boolean }
        }
      }

      response "200", "sharing updated" do
        schema "$ref" => "#/components/schemas/CallEnvelope"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:call) do
          enable_webrtc_calls!
          row = Calls::Create.call(account: user.account, conversation: conversation, kind: "video").value.call
          Calls::Accept.call(account: peer.account, call: row)
          row.reload
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { sharing: true } }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.dig("call", "status")).to eq("active")
          sharing = body.dig("call", "participants").find { |row| row["account_id"] == user.account.id }
          expect(sharing.fetch("is_screen_sharing")).to be(true)
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
          Calls::Create.call(account: user.account, conversation: conversation, kind: "video").value.call
        end
        let(:id) { call.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }
        let(:payload) { { sharing: true } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end
# rubocop:enable RSpec/AnyInstance, RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup
# rubocop:enable RSpec/VariableName
