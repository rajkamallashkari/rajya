require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Pins create", type: :request do
  path "/api/v1/conversations/{conversation_id}/pins" do
    post "Pin a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { message_id: { type: :integer } }
      }

      response "201", "pinned" do
        schema "$ref" => "#/components/schemas/PinnedMessage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_id: message.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("message_id")).to eq(message.id)
        end
      end
    end
  end
end

RSpec.describe "Pins destroy", type: :request do
  path "/api/v1/conversations/{conversation_id}/pins/{message_id}" do
    delete "Unpin a message" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :message_id, in: :path, type: :integer

      response "200", "unpinned" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:conversation_id) { conversation.id }
        let(:message_id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Messages::Pin.call(message: message, actor: user.account) }

        run_test! do
          expect(PinnedMessage.where(message: message)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Saved messages create", type: :request do
  path "/api/v1/saved_messages" do
    post "Save a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { message_id: { type: :integer } }
      }

      response "201", "saved" do
        schema "$ref" => "#/components/schemas/SavedMessage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_id: message.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("message_id")).to eq(message.id)
        end
      end
    end
  end
end

RSpec.describe "Saved messages destroy", type: :request do
  path "/api/v1/saved_messages/{id}" do
    delete "Unsave a message" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "unsaved" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Messages::Save.call(message: message, actor: user.account) }

        run_test! do
          expect(SavedMessage.where(account: user.account, message: message)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
