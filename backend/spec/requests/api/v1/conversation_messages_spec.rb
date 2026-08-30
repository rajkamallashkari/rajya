require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Conversation messages index", type: :request do
  path "/api/v1/conversations/{conversation_id}/messages" do
    get "List messages in a conversation" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :before, in: :query, type: :integer, required: false
      parameter name: :after, in: :query, type: :integer, required: false
      parameter name: :around_id, in: :query, type: :integer, required: false
      parameter name: :around_at, in: :query, type: :string, format: :date_time, required: false

      response "200", "page" do
        schema "$ref" => "#/components/schemas/MessagePage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          create(:message, conversation: conversation, sender_account: user.account, position: 1, body: "Hi")
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("messages").sole.fetch("body")).to eq("Hi")
          expect(body.fetch("meta").fetch("has_more_after")).to be(false)
        end
      end

      response "200", "jump around id" do
        schema "$ref" => "#/components/schemas/MessagePage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { create(:message, conversation: conversation, sender_account: user.account, position: 1) }
        let(:conversation_id) { conversation.id }
        let(:around_id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("meta", "pivot_id")).to eq(message.id)
        end
      end

      response "404", "unknown pivot" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:conversation_id) { conversation.id }
        let(:around_id) { 0 }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Message info", type: :request do
  path "/api/v1/messages/{id}/info" do
    get "Message delivery and read info" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "info" do
        schema "$ref" => "#/components/schemas/MessageInfo"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { create(:message, conversation: conversation, sender_account: user.account, position: 1) }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).keys).to contain_exactly("delivered", "read")
        end
      end
    end
  end
end
# rubocop:enable RSpec/VariableName
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
