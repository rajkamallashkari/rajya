require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Global search", type: :request do
  path "/api/v1/search" do
    get "Search messages, conversations, and people" do
      tags "Search"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :q, in: :query, type: :string
      parameter name: :sender_account_id, in: :query, type: :integer, required: false
      parameter name: :created_after, in: :query, type: :string, format: :"date-time", required: false
      parameter name: :created_before, in: :query, type: :string, format: :"date-time", required: false
      parameter name: :kind, in: :query, type: :string, required: false
      parameter name: :has_attachment, in: :query, type: :boolean, required: false
      parameter name: :has_link, in: :query, type: :boolean, required: false

      response "200", "results" do
        schema "$ref" => "#/components/schemas/GlobalSearch"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:q) { "memento" }
        let(:kind) { "text" }
        let(:conversation) { create_direct_between(user.account, create(:account, display_name: "Memento Peer")) }

        before do
          create(:message, conversation: conversation, sender_account: user.account, body: "a memento of atoms")
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("messages").sole.fetch("snippet")).to include("memento")
          expect(body.fetch("conversations").sole.fetch("title")).to eq("Memento Peer")
        end
      end
    end
  end
end

RSpec.describe "In-chat search", type: :request do
  path "/api/v1/conversations/{id}/search" do
    get "Search messages in a conversation" do
      tags "Search"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :q, in: :query, type: :string
      parameter name: :sender_account_id, in: :query, type: :integer, required: false
      parameter name: :created_after, in: :query, type: :string, format: :"date-time", required: false
      parameter name: :created_before, in: :query, type: :string, format: :"date-time", required: false
      parameter name: :kind, in: :query, type: :string, required: false
      parameter name: :has_attachment, in: :query, type: :boolean, required: false
      parameter name: :has_link, in: :query, type: :boolean, required: false

      response "200", "results" do
        schema "$ref" => "#/components/schemas/ConversationSearch"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { conversation.id }
        let(:q) { "atoms" }
        let(:has_link) { true }

        before do
          create(:message, conversation: conversation, sender_account: user.account,
                           body: "atoms of virtue https://example.com")
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("messages").sole.fetch("conversation_id")).to eq(conversation.id)
        end
      end

      response "422", "invalid filter" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { conversation.id }
        let(:q) { "atoms" }
        let(:kind) { "sticker" }

        run_test! do |response|
          expect(response).to have_http_status(:unprocessable_content)
        end
      end
    end
  end
end

RSpec.describe "People search", type: :request do
  path "/api/v1/accounts/search" do
    get "Search discoverable accounts" do
      tags "Search"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :q, in: :query, type: :string

      response "200", "results" do
        schema "$ref" => "#/components/schemas/AccountSearch"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:q) { "findable" }

        before { create(:user, account: create(:account, username: "findable_raj", display_name: "Findable")) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("accounts").sole.fetch("username")).to eq("findable_raj")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
