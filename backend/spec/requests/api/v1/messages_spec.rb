require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Messages create", type: :request do
  path "/api/v1/messages" do
    post "Send a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          conversation_id: { type: :integer },
          body: { type: :string },
          client_nonce: { type: :string, format: :uuid },
          reply_to_message_id: { type: :integer },
          attachment_signed_ids: { type: :array, items: { type: :string } }
        }
      }

      response "201", "sent" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id, body: "Hello" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("Hello")
        end
      end
    end
  end
end

RSpec.describe "Messages edit", type: :request do
  path "/api/v1/messages/{id}" do
    patch "Edit a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: { type: :object, properties: { body: { type: :string } } }

      response "200", "edited" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Old").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { body: "New" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("New")
        end
      end
    end
  end
end

RSpec.describe "Messages unsend", type: :request do
  path "/api/v1/messages/{id}" do
    delete "Unsend a message" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "tombstoned" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Bye").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("deleted")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Messages forward", type: :request do
  path "/api/v1/messages/{id}/forward" do
    post "Forward a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { conversation_id: { type: :integer } }
      }

      response "201", "forwarded" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:source) { create_direct_between(user.account, create(:account)) }
        let(:target) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: source, sender: user.account, body: "Fwd").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: target.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversation_id")).to eq(target.id)
        end
      end
    end
  end
end

RSpec.describe "Reactions create", type: :request do
  path "/api/v1/messages/{message_id}/reactions" do
    post "Add a reaction" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :message_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: { type: :object, properties: { emoji: { type: :string } } }

      response "201", "reacted" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:message_id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { emoji: "👍" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("reaction_summary")).to include("👍" => 1)
        end
      end
    end
  end
end

RSpec.describe "Reactions destroy", type: :request do
  path "/api/v1/messages/{message_id}/reactions/{emoji}" do
    delete "Remove a reaction" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :message_id, in: :path, type: :integer
      parameter name: :emoji, in: :path, type: :string

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:message_id) { message.id }
        let(:emoji) { "up" }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Messages::React.call(message: message, actor: user.account, emoji: "up") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("reaction_summary")).to eq({})
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
