require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Conversations index", type: :request do
  path "/api/v1/conversations" do
    get "List the current account's conversations" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "sidebar" do
        schema "$ref" => "#/components/schemas/ConversationList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversations").size).to eq(1)
        end
      end
    end

    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_id: { type: :integer },
          account_ids: { type: :array, items: { type: :integer } },
          title: { type: :string },
          description: { type: :string }
        }
      }

      response "201", "direct created" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:peer) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "direct", account_id: peer.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("kind")).to eq("direct")
        end
      end
    end
  end
end

RSpec.describe "Conversations create group", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_ids: { type: :array, items: { type: :integer } },
          title: { type: :string }
        }
      }

      response "201", "group created" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:other) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "group", account_ids: [ other.id ], title: "Team" } }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("kind")).to eq("group")
          expect(body.fetch("title")).to eq("Team")
        end
      end
    end
  end
end

RSpec.describe "Conversations create blocked", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_id: { type: :integer }
        }
      }

      response "404", "blocked new DM (NR-1)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "direct", account_id: peer.id } }

        before { create(:block, blocker_account: user.account, blocked_account: peer) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Conversations show", type: :request do
  path "/api/v1/conversations/{id}" do
    get "Show a conversation" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(conversation.id)
        end
      end
    end
  end
end

RSpec.describe "Conversations show hidden", type: :request do
  path "/api/v1/conversations/{id}" do
    get "Show a conversation" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "404", "not a member" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Conversations update", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          title: { type: :string },
          description: { type: :string }
        }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { title: "Renamed", description: "New bio" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("title" => "Renamed", "description" => "New bio")
        end
      end
    end
  end
end

RSpec.describe "Conversations update title only", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { title: { type: :string } }
      }

      response "200", "title only" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { title: "Title only" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("title")).to eq("Title only")
        end
      end
    end
  end
end

RSpec.describe "Conversations update description only", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { description: { type: :string } }
      }

      response "200", "description only" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { description: "Bio only" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("description")).to eq("Bio only")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
