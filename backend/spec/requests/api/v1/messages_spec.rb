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
          attachment_signed_ids: { type: :array, items: { type: :string } },
          poll: {
            type: :object,
            properties: {
              question: { type: :string },
              options: { type: :array, items: { type: :string } },
              allows_multiple: { type: :boolean },
              is_anonymous: { type: :boolean },
              closes_at: { type: :string, format: :"date-time" }
            }
          },
          location: { "$ref" => "#/components/schemas/MessageLocation" },
          silent: { type: :boolean },
          contacts: {
            type: :array,
            items: {
              type: :object,
              properties: {
                contact_account_id: { type: :integer, nullable: true },
                display_name: { type: :string },
                phone: { type: :string, nullable: true },
                email: { type: :string, nullable: true }
              }
            }
          }
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

  it "accepts a poll payload on send" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    post "/api/v1/messages", headers: auth_headers_for(user), as: :json, params: {
      conversation_id: conversation.id,
      poll: { question: "Lunch?", options: %w[Yes No], closes_at: 1.hour.from_now.iso8601 }
    }
    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body).dig("poll", "question")).to eq("Lunch?")
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

RSpec.describe "Messages show", type: :request do
  path "/api/v1/messages/{id}" do
    get "Resolve a message permalink" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "found" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(message.id)
        end
      end
    end
  end
end

RSpec.describe "Reaction details", type: :request do
  path "/api/v1/messages/{message_id}/reactions" do
    get "List reaction details" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :message_id, in: :path, type: :integer

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/ReactionDetails"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:message_id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Messages::React.call(message: message, actor: user.account, emoji: "👍") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("reactions").sole.fetch("emoji")).to eq("👍")
        end
      end
    end
  end
end

RSpec.describe "Messages bulk unsend", type: :request do
  path "/api/v1/messages/bulk_unsend" do
    post "Bulk unsend messages" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { message_ids: { type: :array, items: { type: :integer } } }
      }

      response "200", "tombstoned" do
        schema "$ref" => "#/components/schemas/MessageList"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Bye").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_ids: [ message.id ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("messages").sole.fetch("deleted")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Messages bulk forward", type: :request do
  path "/api/v1/messages/bulk_forward" do
    post "Bulk forward messages" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          message_ids: { type: :array, items: { type: :integer } },
          conversation_id: { type: :integer }
        }
      }

      response "201", "forwarded" do
        schema "$ref" => "#/components/schemas/MessageList"
        let(:user) { create(:user) }
        let(:source) { create_direct_between(user.account, create(:account)) }
        let(:target) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: source, sender: user.account, body: "Fwd").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_ids: [ message.id ], conversation_id: target.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("messages").sole.fetch("conversation_id")).to eq(target.id)
        end
      end
    end
  end
end

RSpec.describe "Messages bulk save", type: :request do
  path "/api/v1/messages/bulk_save" do
    post "Bulk save messages" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { message_ids: { type: :array, items: { type: :integer } } }
      }

      response "201", "saved" do
        schema "$ref" => "#/components/schemas/SavedMessageList"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_ids: [ message.id ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("saved_messages").size).to eq(1)
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
